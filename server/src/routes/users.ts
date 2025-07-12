import { Router, Request, Response } from 'express';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Get all public users (for browsing)
router.get('/browse', authenticateToken, (req: AuthRequest, res: Response) => {
    const { search, skill } = req.query;

    let query = `
    SELECT u.id, u.name, u.location, u.profilePhoto, u.availability, u.createdAt,
           COUNT(DISTINCT s_offered.id) as offeredSkillsCount,
           COUNT(DISTINCT s_wanted.id) as wantedSkillsCount
    FROM users u
    LEFT JOIN skills s_offered ON u.id = s_offered.userId AND s_offered.type = 'offered'
    LEFT JOIN skills s_wanted ON u.id = s_wanted.userId AND s_wanted.type = 'wanted'
    WHERE u.isPublic = 1 AND u.id != ?
  `;

    const params: any[] = [req.user?.id || 0];

    if (search) {
        query += ` AND (u.name LIKE ? OR u.location LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    if (skill) {
        query += ` AND (s_offered.name LIKE ? OR s_wanted.name LIKE ?)`;
        params.push(`%${skill}%`, `%${skill}%`);
    }

    query += ` GROUP BY u.id ORDER BY u.createdAt DESC`;

    db.all(query, params, (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ users });
    });
});

// Get user profile by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    const userId = parseInt(req.params.id);

    if (!userId) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get user info
    db.get(`
    SELECT id, name, location, profilePhoto, availability, isPublic, createdAt
    FROM users WHERE id = ?
  `, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if profile is private and user is not the owner
        if (!(user as any).isPublic && (user as any).id !== req.user?.id) {
            return res.status(403).json({ error: 'Profile is private' });
        }

        // Get user's skills
        db.all(`
      SELECT id, name, description, type, level, createdAt
      FROM skills WHERE userId = ?
      ORDER BY type, createdAt DESC
    `, [userId], (err, skills) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Get user's ratings
            db.all(`
        SELECT AVG(rating) as averageRating, COUNT(*) as totalRatings
        FROM ratings WHERE toUserId = ?
      `, [userId], (err, ratings) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                    user: {
                        ...user,
                        averageRating: (ratings[0] as any)?.averageRating || 0,
                        totalRatings: (ratings[0] as any)?.totalRatings || 0
                    },
                    skills: {
                        offered: skills.filter((s: any) => s.type === 'offered'),
                        wanted: skills.filter((s: any) => s.type === 'wanted')
                    }
                });
            });
        });
    });
});

// Get current user's swap requests
router.get('/me/swaps', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status } = req.query;

    let query = `
    SELECT sr.*, 
           u1.name as fromUserName, u1.profilePhoto as fromUserPhoto,
           u2.name as toUserName, u2.profilePhoto as toUserPhoto,
           s1.name as offeredSkillName, s1.description as offeredSkillDescription,
           s2.name as wantedSkillName, s2.description as wantedSkillDescription
    FROM swap_requests sr
    JOIN users u1 ON sr.fromUserId = u1.id
    JOIN users u2 ON sr.toUserId = u2.id
    JOIN skills s1 ON sr.offeredSkillId = s1.id
    JOIN skills s2 ON sr.wantedSkillId = s2.id
    WHERE sr.fromUserId = ? OR sr.toUserId = ?
  `;

    const params: any[] = [req.user.id, req.user.id];

    if (status) {
        query += ` AND sr.status = ?`;
        params.push(status);
    }

    query += ` ORDER BY sr.createdAt DESC`;

    db.all(query, params, (err, swaps) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ swaps });
    });
});

// Get user's ratings
router.get('/:id/ratings', authenticateToken, (req: AuthRequest, res: Response) => {
    const userId = parseInt(req.params.id);

    if (!userId) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    db.all(`
    SELECT r.*, u.name as fromUserName, u.profilePhoto as fromUserPhoto
    FROM ratings r
    JOIN users u ON r.fromUserId = u.id
    WHERE r.toUserId = ?
    ORDER BY r.createdAt DESC
  `, [userId], (err, ratings) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ ratings });
    });
});

export { router as userRoutes }; 