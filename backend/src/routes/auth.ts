import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').optional().trim(),
    body('role').optional().isIn(['ADMIN', 'OPERATOR']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new AppError(400, 'Validation failed', false));
      }

      const { email, password, name, role } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return next(new AppError(409, 'User already exists'));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'OPERATOR',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      const jwtSecret = process.env.JWT_SECRET || 'default-secret';
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
      const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn } as SignOptions
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        jwtRefreshSecret,
        { expiresIn: refreshExpiresIn } as SignOptions
      );

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new AppError(400, 'Invalid credentials'));
      }

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return next(new AppError(401, 'Invalid credentials'));
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return next(new AppError(401, 'Invalid credentials'));
      }

      const jwtSecret = process.env.JWT_SECRET || 'default-secret';
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
      const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn } as SignOptions
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        jwtRefreshSecret,
        { expiresIn: refreshExpiresIn } as SignOptions
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError(401, 'Refresh token required'));
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret'
    ) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return next(new AppError(401, 'User not found'));
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn } as SignOptions
    );

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    next(new AppError(401, 'Invalid refresh token'));
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };

