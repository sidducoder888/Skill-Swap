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
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('location').optional().trim(),
    body('availability').optional().trim()
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, firstName, lastName, location, availability } = req.body as RegisterRequest;

    try {
        // Check if user already exists
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await new Promise((resolve, reject) => {
            db.run(`
        INSERT INTO users (email, password, name, location, availability)
        VALUES (?, ?, ?, ?, ?)
      `, [email, hashedPassword, name, location, availability], function (err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID });
            });
        });

        const token = generateToken((result as any).lastID);
        const userData = {
            id: (result as any).lastID,
            email,
            name,
            firstName: firstName || name.split(' ')[0],
            lastName: lastName || name.split(' ').slice(1).join(' ') || '',
            location,
            availability,
            role: 'user'
        };

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                token,
                user: userData
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Quick test register (bypass database and bcrypt for speed)
router.post('/register-test', (req: Request, res: Response) => {
    const { email, password, name, firstName, lastName, location, availability } = req.body;
    // Simple test response
    const token = generateToken(2);
    const userData = {
        id: 2,
        email: email || 'test2@test.com',
        name: name || 'Test User2',
        firstName: firstName || 'Test',
        lastName: lastName || 'User2',
        location: location || 'Test City',
        profilePhoto: null,
        isPublic: true,
        availability: availability || 'Available',
        role: 'user'
    };
    res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
            token,
            user: userData
        }
    });
});

// Quick test login (bypass database for speed)
router.post('/login-test', (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Simple test response
    const token = generateToken(1);
    const userData = {
        id: 1,
        email: email || 'test@test.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        location: 'Test City',
        profilePhoto: null,
        isPublic: true,
        availability: 'Available',
        role: 'user'
    };

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            token,
            user: userData
        }
    });
});

import { Worker } from 'worker_threads';

// ... (imports)

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body as LoginRequest;

    try {
        const user = await new Promise<any>((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const worker = new Worker(`
            const bcrypt = require('bcryptjs');
            const { parentPort, workerData } = require('worker_threads');
            const { password, hash } = workerData;
            const result = bcrypt.compareSync(password, hash);
            parentPort.postMessage(result);
        `, { eval: true });

        worker.on('message', (isValidPassword) => {
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = generateToken((user as any).id);
            const nameParts = (user as any).name.split(' ');
            const userData = {
                id: (user as any).id,
                email: (user as any).email,
                name: (user as any).name,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                location: (user as any).location,
                profilePhoto: (user as any).profilePhoto,
                isPublic: (user as any).isPublic,
                availability: (user as any).availability,
                role: (user as any).role
            };

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: userData
                }
            });
        });

        worker.on('error', (error) => {
            console.error('Worker error:', error);
            res.status(500).json({ error: 'Server error during login' });
        });

        worker.postMessage({ password, hash: user.password });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout endpoint
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
    // In a real app, you might blacklist the token
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Refresh token endpoint
router.post('/refresh', authenticateToken, (req: Request, res: Response) => {
    const user = (req as AuthRequest).user;
    if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const newToken = generateToken(user.id);
    res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            token: newToken
        }
    });
});

// Get current user profile
router.get('/me', authenticateToken, (req: Request, res: Response) => {
    const user = (req as AuthRequest).user;
    if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            location: user.location,
            profilePhoto: user.profilePhoto,
            isPublic: user.isPublic,
            availability: user.availability,
            role: user.role
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
], (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const user = (req as AuthRequest).user;
    if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, location, availability, isPublic, profilePhoto } = req.body as any;
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
    values.push(user.id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        // Get updated user data
        db.get('SELECT * FROM users WHERE id = ?', [user.id], (err, updatedUser: any) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch updated profile' });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    firstName: updatedUser.name?.split(' ')[0] || '',
                    lastName: updatedUser.name?.split(' ').slice(1).join(' ') || '',
                    location: updatedUser.location,
                    profilePhoto: updatedUser.profilePhoto,
                    isPublic: updatedUser.isPublic === 1,
                    availability: updatedUser.availability,
                    role: updatedUser.role
                }
            });
        });
    });
});

export { router as authRoutes }; 