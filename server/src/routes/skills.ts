import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest, CreateSkillRequest } from '../types';

const router = Router();

// Get current user's skills
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    db.all(`
    SELECT id, name, description, type, level, createdAt
    FROM skills WHERE userId = ?
    ORDER BY type, createdAt DESC
  `, [req.user.id], (err, skills) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({
            skills: {
                offered: skills.filter((s: any) => s.type === 'offered'),
                wanted: skills.filter((s: any) => s.type === 'wanted')
            }
        });
    });
});

// Create a new skill
router.post('/', authenticateToken, [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('description').trim().isLength({ min: 10, max: 500 }),
    body('type').isIn(['offered', 'wanted']),
    body('level').isIn(['beginner', 'intermediate', 'advanced'])
], (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, description, type, level }: CreateSkillRequest = req.body;

    db.run(`
    INSERT INTO skills (userId, name, description, type, level)
    VALUES (?, ?, ?, ?, ?)
  `, [req.user.id, name, description, type, level], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create skill' });
        }

        res.status(201).json({
            message: 'Skill created successfully',
            skill: {
                id: this.lastID,
                userId: req.user?.id,
                name,
                description,
                type,
                level
            }
        });
    });
});

// Update a skill
router.put('/:id', authenticateToken, [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ min: 10, max: 500 }),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced'])
], (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const skillId = parseInt(req.params.id);
    const { name, description, level } = req.body;

    // Check if skill belongs to user
    db.get('SELECT id FROM skills WHERE id = ? AND userId = ?', [skillId, req.user.id], (err, skill) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!skill) {
            return res.status(404).json({ error: 'Skill not found or not owned by user' });
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (level !== undefined) {
            updates.push('level = ?');
            values.push(level);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(skillId);

        const query = `UPDATE skills SET ${updates.join(', ')} WHERE id = ?`;

        db.run(query, values, function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update skill' });
            }

            res.json({ message: 'Skill updated successfully' });
        });
    });
});

// Delete a skill
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const skillId = parseInt(req.params.id);

    // Check if skill belongs to user
    db.get('SELECT id FROM skills WHERE id = ? AND userId = ?', [skillId, req.user.id], (err, skill) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!skill) {
            return res.status(404).json({ error: 'Skill not found or not owned by user' });
        }

        db.run('DELETE FROM skills WHERE id = ?', [skillId], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete skill' });
            }

            res.json({ message: 'Skill deleted successfully' });
        });
    });
});

// Search skills across all users
router.get('/search', authenticateToken, (req: AuthRequest, res: Response) => {
    const { q, type, level } = req.query;

    let query = `
    SELECT s.*, u.name as userName, u.location as userLocation, u.profilePhoto as userPhoto
    FROM skills s
    JOIN users u ON s.userId = u.id
    WHERE u.isPublic = 1 AND u.id != ?
  `;

    const params: any[] = [req.user?.id || 0];

    if (q) {
        query += ` AND (s.name LIKE ? OR s.description LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
    }

    if (type) {
        query += ` AND s.type = ?`;
        params.push(type);
    }

    if (level) {
        query += ` AND s.level = ?`;
        params.push(level);
    }

    query += ` ORDER BY s.createdAt DESC`;

    db.all(query, params, (err, skills) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ skills });
    });
});

export { router as skillRoutes }; 