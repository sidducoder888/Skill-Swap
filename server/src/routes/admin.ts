import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Apply admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users (admin only)
router.get('/users', (req: AuthRequest, res: Response) => {
    const { search, role, status } = req.query;

    let query = `
    SELECT id, email, name, location, isPublic, role, createdAt,
           COUNT(DISTINCT s.id) as skillsCount,
           COUNT(DISTINCT sr.id) as swapRequestsCount
    FROM users u
    LEFT JOIN skills s ON u.id = s.userId
    LEFT JOIN swap_requests sr ON (u.id = sr.fromUserId OR u.id = sr.toUserId)
  `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
        conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.location LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
        conditions.push('u.role = ?');
        params.push(role);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY u.id ORDER BY u.createdAt DESC`;

    db.all(query, params, (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ users });
    });
});

// Ban/unban user
router.put('/users/:id/ban', [
    body('banned').isBoolean()
], (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = parseInt(req.params.id);
    const { banned } = req.body;

    if (userId === req.user?.id) {
        return res.status(400).json({ error: 'Cannot ban yourself' });
    }

    db.run(`
    UPDATE users SET role = ? WHERE id = ?
  `, [banned ? 'banned' : 'user', userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update user' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: `User ${banned ? 'banned' : 'unbanned'} successfully`
        });
    });
});

// Get all swap requests (admin only)
router.get('/swaps', (req: AuthRequest, res: Response) => {
    const { status, fromUserId, toUserId } = req.query;

    let query = `
    SELECT sr.*, 
           u1.name as fromUserName, u1.email as fromUserEmail,
           u2.name as toUserName, u2.email as toUserEmail,
           s1.name as offeredSkillName, s2.name as wantedSkillName
    FROM swap_requests sr
    JOIN users u1 ON sr.fromUserId = u1.id
    JOIN users u2 ON sr.toUserId = u2.id
    JOIN skills s1 ON sr.offeredSkillId = s1.id
    JOIN skills s2 ON sr.wantedSkillId = s2.id
  `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
        conditions.push('sr.status = ?');
        params.push(status);
    }

    if (fromUserId) {
        conditions.push('sr.fromUserId = ?');
        params.push(fromUserId);
    }

    if (toUserId) {
        conditions.push('sr.toUserId = ?');
        params.push(toUserId);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY sr.createdAt DESC`;

    db.all(query, params, (err, swaps) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ swaps });
    });
});

// Get platform statistics
router.get('/stats', (req: AuthRequest, res: Response) => {
    const stats: any = {};

    // User stats
    db.get('SELECT COUNT(*) as totalUsers FROM users', (err, userCount) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        stats.totalUsers = (userCount as any).totalUsers;

        // Skill stats
        db.get('SELECT COUNT(*) as totalSkills FROM skills', (err, skillCount) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            stats.totalSkills = (skillCount as any).totalSkills;

            // Swap stats
            db.get('SELECT COUNT(*) as totalSwaps FROM swap_requests', (err, swapCount) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                stats.totalSwaps = (swapCount as any).totalSwaps;

                // Rating stats
                db.get('SELECT AVG(rating) as averageRating, COUNT(*) as totalRatings FROM ratings', (err, ratingStats) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    stats.averageRating = (ratingStats as any).averageRating || 0;
                    stats.totalRatings = (ratingStats as any).totalRatings;

                    // Status breakdown
                    db.all(`
            SELECT status, COUNT(*) as count 
            FROM swap_requests 
            GROUP BY status
          `, (err, statusBreakdown) => {
                        if (err) {
                            return res.status(500).json({ error: 'Database error' });
                        }
                        stats.swapStatusBreakdown = statusBreakdown;

                        res.json({ stats });
                    });
                });
            });
        });
    });
});

// Get all ratings (admin only)
router.get('/ratings', (req: AuthRequest, res: Response) => {
    const { fromUserId, toUserId, minRating, maxRating } = req.query;

    let query = `
    SELECT r.*, 
           u1.name as fromUserName, u1.email as fromUserEmail,
           u2.name as toUserName, u2.email as toUserEmail,
           sr.id as swapId
    FROM ratings r
    JOIN users u1 ON r.fromUserId = u1.id
    JOIN users u2 ON r.toUserId = u2.id
    JOIN swap_requests sr ON r.swapId = sr.id
  `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (fromUserId) {
        conditions.push('r.fromUserId = ?');
        params.push(fromUserId);
    }

    if (toUserId) {
        conditions.push('r.toUserId = ?');
        params.push(toUserId);
    }

    if (minRating) {
        conditions.push('r.rating >= ?');
        params.push(minRating);
    }

    if (maxRating) {
        conditions.push('r.rating <= ?');
        params.push(maxRating);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY r.createdAt DESC`;

    db.all(query, params, (err, ratings) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ ratings });
    });
});

// Delete inappropriate skill
router.delete('/skills/:id', (req: AuthRequest, res: Response) => {
    const skillId = parseInt(req.params.id);

    db.get('SELECT id FROM skills WHERE id = ?', [skillId], (err, skill) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!skill) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        db.run('DELETE FROM skills WHERE id = ?', [skillId], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete skill' });
            }

            res.json({ message: 'Skill deleted successfully' });
        });
    });
});

// Get system logs (simplified - in a real app you'd have a proper logging system)
router.get('/logs', (req: AuthRequest, res: Response) => {
    // This is a placeholder - in a real application you'd have proper logging
    res.json({
        message: 'Log system not implemented in this demo',
        note: 'In a production app, this would return system logs, error logs, etc.'
    });
});

export { router as adminRoutes }; 