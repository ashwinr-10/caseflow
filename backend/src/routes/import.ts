import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { PrismaClient, CaseCategory, CasePriority } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateCaseRow, normalizeCaseData } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only CSV files are allowed') as any);
    }
  },
});

// Upload and parse CSV
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        return next(new AppError(400, 'No file uploaded'));
      }

      const fileBuffer = req.file.buffer.toString('utf-8');
      const records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (records.length === 0) {
        return next(new AppError(400, 'CSV file is empty'));
      }

      // Validate and normalize data
      const validatedRows = records.map((row: any, index: number) => {
        const normalized = normalizeCaseData(row);
        const validation = validateCaseRow(normalized, index);
        return {
          rowIndex: index + 2, // +2 because CSV is 1-indexed and has header
          data: normalized,
          errors: validation.errors,
          isValid: validation.isValid,
        };
      });

      res.json({
        success: true,
        data: {
          rows: validatedRows,
          totalRows: records.length,
          columns: Object.keys(records[0] || {}),
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError(400, 'Failed to parse CSV file'));
      }
    }
  }
);

// Batch create cases
router.post(
  '/batch',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { rows, fileName } = req.body;

      if (!Array.isArray(rows) || rows.length === 0) {
        return next(new AppError(400, 'No rows provided'));
      }

      // Create import job
      const importJob = await prisma.importJob.create({
        data: {
          userId: req.user!.id,
          fileName: fileName || 'unknown.csv',
          totalRows: rows.length,
          status: 'processing',
        },
      });

      const results = {
        success: [] as any[],
        failed: [] as any[],
      };

      // Process in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);

        await Promise.allSettled(
          chunk.map(async (row: any) => {
            try {
              const normalized = normalizeCaseData(row.data || row);
              const validation = validateCaseRow(normalized, row.rowIndex || 0);

              if (!validation.isValid) {
                results.failed.push({
                  rowIndex: row.rowIndex,
                  data: normalized,
                  errors: validation.errors,
                });
                return;
              }

              // Check if case_id already exists
              const existing = await prisma.case.findUnique({
                where: { caseId: normalized.case_id },
              });

              if (existing) {
                results.failed.push({
                  rowIndex: row.rowIndex,
                  data: normalized,
                  errors: ['case_id already exists'],
                });
                return;
              }

              const newCase = await prisma.case.create({
                data: {
                  caseId: normalized.case_id,
                  applicantName: normalized.applicant_name,
                  dob: new Date(normalized.dob),
                  email: normalized.email || null,
                  phone: normalized.phone || null,
                  category: normalized.category as CaseCategory,
                  priority: (normalized.priority || 'LOW') as CasePriority,
                  importJobId: importJob.id,
                },
              });

              // Create audit log
              await prisma.auditLog.create({
                data: {
                  userId: req.user!.id,
                  caseId: newCase.id,
                  action: 'import',
                  details: { importJobId: importJob.id },
                },
              });

              results.success.push({
                rowIndex: row.rowIndex,
                caseId: newCase.caseId,
              });
            } catch (error) {
              results.failed.push({
                rowIndex: row.rowIndex,
                data: row.data || row,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
              });
            }
          })
        );
      }

      // Update import job
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          successRows: results.success.length,
          failedRows: results.failed.length,
          status: results.failed.length === 0 ? 'completed' : 'completed',
        },
      });

      res.json({
        success: true,
        data: {
          importJobId: importJob.id,
          results,
          summary: {
            total: rows.length,
            success: results.success.length,
            failed: results.failed.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get import jobs
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const importJobs = await prisma.importJob.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      data: { importJobs },
    });
  } catch (error) {
    next(error);
  }
});

// Get import job details
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const importJob = await prisma.importJob.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        cases: {
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!importJob) {
      return next(new AppError(404, 'Import job not found'));
    }

    res.json({
      success: true,
      data: { importJob },
    });
  } catch (error) {
    next(error);
  }
});

export { router as importRoutes };
