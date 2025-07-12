import { Router, Request, Response } from 'express';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const [user, skills, swaps, stats] = await Promise.all([
      getUser(userId),
      getSkills(userId),
      getSwaps(userId),
      getStats(userId),
    ]);

    res.json({
      user,
      skills,
      swaps,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

const getUser = (userId: number) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name, email, location FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) reject(err);
      resolve(user);
    });
  });
};

const getSkills = (userId: number) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM skills WHERE userId = ?', [userId], (err, skills) => {
      if (err) reject(err);
      resolve(skills);
    });
  });
};

const getSwaps = (userId: number) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM swap_requests WHERE fromUserId = ? OR toUserId = ?', [userId, userId], (err, swaps) => {
      if (err) reject(err);
      resolve(swaps);
    });
  });
};

const getStats = (userId: number) => {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT
        (SELECT COUNT(*) FROM skills WHERE userId = ?) as skillsCount,
        (SELECT COUNT(*) FROM swap_requests WHERE fromUserId = ? OR toUserId = ?) as swapsCount
      FROM users
      WHERE id = ?
    `, [userId, userId, userId, userId], (err, stats) => {
      if (err) reject(err);
      resolve(stats);
    });
  });
};

export { router as dashboardRoutes };
