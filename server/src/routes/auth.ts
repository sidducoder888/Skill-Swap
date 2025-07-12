import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { generateToken, authenticateToken } from '../middleware/auth';
import { User, LoginRequest, RegisterRequest, AuthRequest } from '../types';

const router = Router();

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 }),
    body('location').optional().trim(),
    body('availability').optional().trim()
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, location, availability }: RegisterRequest = req.body;

    try {
        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            db.run(`
        INSERT INTO users (email, password, name, location, availability)
        VALUES (?, ?, ?, ?, ?)
      `, [email, hashedPassword, name, location, availability], function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create user' });
                }

                const token = generateToken(this.lastID);
                res.status(201).json({
                    message: 'User created successfully',
                    token,
                    user: {
                        id: this.lastID,
                        email,
                        name,
                        location,
                        availability,
                        role: 'user'
                    }
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password }: LoginRequest = req.body;

    try {
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: User) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = generateToken(user.id);
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    location: user.location,
                    profilePhoto: user.profilePhoto,
                    isPublic: user.isPublic,
                    availability: user.availability,
                    role: user.role
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user profile
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            location: req.user.location,
            profilePhoto: req.user.profilePhoto,
            isPublic: req.user.isPublic,
            availability: req.user.availability,
            role: req.user.role
        }
    });
});

// Update profile
router.put('/profile', authenticateToken, [
    body('name').optional().trim().isLength({ min: 2 }),
    body('location').optional().trim(),
    body('availability').optional().trim(),
    body('isPublic').optional().isBoolean(),
    body('profilePhoto').optional().trim()
], (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, location, availability, isPublic, profilePhoto } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
    }
    if (location !== undefined) {
        updates.push('location = ?');
        values.push(location);
    }
    if (availability !== undefined) {
        updates.push('availability = ?');
        values.push(availability);
    }
    if (isPublic !== undefined) {
        updates.push('isPublic = ?');
        values.push(isPublic);
    }
    if (profilePhoto !== undefined) {
        updates.push('profilePhoto = ?');
        values.push(profilePhoto);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        res.json({ message: 'Profile updated successfully' });
    });
});

export { router as authRoutes }; 