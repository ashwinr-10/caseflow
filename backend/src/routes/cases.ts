import { Router, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all cases with pagination and filters
router.get(
  '/',
  authenticate,
  [
    query('cursor').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']),
    query('category').optional().isIn(['TAX', 'LICENSE', 'PERMIT']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    query('assigneeId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('search').optional().isString(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new AppError(400, 'Invalid query parameters'));
      }

      const {
        cursor,
        limit = 20,
        status,
        category,
        priority,
        assigneeId,
        startDate,
        endDate,
        search,
      } = req.query;

      const where: any = {};

      if (status) where.status = status;
      if (category) where.category = category;
      if (priority) where.priority = priority;
      if (assigneeId) where.assigneeId = assigneeId;

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      if (search) {
        where.OR = [
          { caseId: { contains: search as string, mode: 'insensitive' } },
          { applicantName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (cursor) {
        where.id = { gt: cursor };
      }

      const cases = await prisma.case.findMany({
        where,
        take: limit as number,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: {
            select: { id: true, email: true, name: true },
          },
          importJob: {
            select: { id: true, fileName: true, createdAt: true },
          },
        },
      });

      const nextCursor = cases.length === limit ? cases[cases.length - 1].id : null;

      res.json({
        success: true,
        data: {
          cases,
          pagination: {
            nextCursor,
            hasMore: nextCursor !== null,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get case by ID
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, email: true, name: true },
        },
        importJob: {
          select: { id: true, fileName: true, createdAt: true },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            case: {
              select: { caseId: true },
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    if (!caseData) {
      return next(new AppError(404, 'Case not found'));
    }

    res.json({
      success: true,
      data: { case: caseData },
    });
  } catch (error) {
    next(error);
  }
});

// Update case
router.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingCase = await prisma.case.findUnique({
      where: { id },
    });

    if (!existingCase) {
      return next(new AppError(404, 'Case not found'));
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updates,
      include: {
        assignee: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        caseId: id,
        action: 'update',
        details: { updates },
      },
    });

    res.json({
      success: true,
      data: { case: updatedCase },
    });
  } catch (error) {
    next(error);
  }
});

// Add note to case
router.post('/:id/notes', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return next(new AppError(400, 'Note content is required'));
    }

    const existingCase = await prisma.case.findUnique({
      where: { id },
    });

    if (!existingCase) {
      return next(new AppError(404, 'Case not found'));
    }

    const note = await prisma.caseNote.create({
      data: {
        caseId: id,
        content: content.trim(),
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: { note },
    });
  } catch (error) {
    next(error);
  }
});

export { router as caseRoutes };

