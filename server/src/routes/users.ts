import express from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, (req: Request, res: Response) => {
    db.all('SELECT id, name, email, location, availability, profilePhoto, isPublic FROM users WHERE isPublic = 1', (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

// Get user by ID
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
    const { id } = req.params;
    db.get('SELECT id, name, email, location, availability, profilePhoto, isPublic FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

// Update user profile
router.put('/profile', authenticateToken, [
    body('name').optional().isString(),
    body('location').optional().isString(),
    body('availability').optional().isString(),
    body('isPublic').optional().isBoolean()
], (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).user.id;
    const { name, location, availability, isPublic } = req.body;

    const updates = [];
    const values = [];

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

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);

    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, function (err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Profile updated successfully' });
    });
});

// Generate mock data for frontend
router.get('/mock/data', (req: Request, res: Response) => {
    const mockUsers = [
        {
            id: 1,
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            location: 'New York, NY',
            availability: 'Weekends',
            profilePhoto: null,
            isPublic: true,
            skills: ['Photography', 'Web Development', 'Spanish'],
            rating: 4.8,
            swapsCompleted: 15
        },
        {
            id: 2,
            name: 'Mike Chen',
            email: 'mike@example.com',
            location: 'San Francisco, CA',
            availability: 'Evenings',
            profilePhoto: null,
            isPublic: true,
            skills: ['Cooking', 'Graphic Design', 'Mandarin'],
            rating: 4.6,
            swapsCompleted: 12
        },
        {
            id: 3,
            name: 'Maria Garcia',
            email: 'maria@example.com',
            location: 'Los Angeles, CA',
            availability: 'Flexible',
            profilePhoto: null,
            isPublic: true,
            skills: ['Spanish', 'JavaScript', 'UI/UX Design'],
            rating: 4.9,
            swapsCompleted: 20
        },
        {
            id: 4,
            name: 'Alex Thompson',
            email: 'alex@example.com',
            location: 'Chicago, IL',
            availability: 'Weekdays',
            profilePhoto: null,
            isPublic: true,
            skills: ['React', 'Python', 'Guitar'],
            rating: 4.7,
            swapsCompleted: 18
        },
        {
            id: 5,
            name: 'Emma Wilson',
            email: 'emma@example.com',
            location: 'Seattle, WA',
            availability: 'Weekends',
            profilePhoto: null,
            isPublic: true,
            skills: ['Fitness Training', 'French', 'Digital Marketing'],
            rating: 4.5,
            swapsCompleted: 10
        }
    ];

    const mockSkills = [
        { id: 1, name: 'JavaScript', category: 'Programming', level: 'Advanced', icon: 'code' },
        { id: 2, name: 'React', category: 'Programming', level: 'Intermediate', icon: 'code' },
        { id: 3, name: 'UI/UX Design', category: 'Design', level: 'Beginner', icon: 'brush' },
        { id: 4, name: 'Spanish', category: 'Language', level: 'Intermediate', icon: 'language' },
        { id: 5, name: 'Photography', category: 'Creative', level: 'Advanced', icon: 'camera' },
        { id: 6, name: 'Cooking', category: 'Lifestyle', level: 'Intermediate', icon: 'restaurant' },
        { id: 7, name: 'Guitar', category: 'Music', level: 'Beginner', icon: 'music_note' },
        { id: 8, name: 'Fitness Training', category: 'Health', level: 'Advanced', icon: 'fitness_center' },
        { id: 9, name: 'Python', category: 'Programming', level: 'Intermediate', icon: 'code' },
        { id: 10, name: 'French', category: 'Language', level: 'Beginner', icon: 'language' }
    ];

    const mockActivities = [
        {
            id: 1,
            type: 'swap',
            title: 'Skill Swap Completed',
            description: 'Successfully swapped JavaScript tutoring for Spanish lessons',
            timestamp: '2 hours ago',
            user: 'Maria Garcia'
        },
        {
            id: 2,
            type: 'message',
            title: 'New Message',
            description: 'John sent you a message about guitar lessons',
            timestamp: '4 hours ago',
            user: 'John Smith'
        },
        {
            id: 3,
            type: 'skill_added',
            title: 'Skill Added',
            description: 'Added "Advanced React" to your skills',
            timestamp: '1 day ago'
        },
        {
            id: 4,
            type: 'achievement',
            title: 'Achievement Unlocked',
            description: 'Completed 10 skill swaps!',
            timestamp: '2 days ago'
        },
        {
            id: 5,
            type: 'swap',
            title: 'New Swap Request',
            description: 'Sarah wants to swap Photography for Web Development',
            timestamp: '3 days ago',
            user: 'Sarah Johnson'
        }
    ];

    const mockSwapRequests = [
        {
            id: 1,
            fromUser: 'Sarah Johnson',
            skillOffered: 'Photography',
            skillWanted: 'Web Development',
            status: 'pending',
            timestamp: '1 hour ago'
        },
        {
            id: 2,
            fromUser: 'Mike Chen',
            skillOffered: 'Cooking',
            skillWanted: 'Graphic Design',
            status: 'pending',
            timestamp: '3 hours ago'
        },
        {
            id: 3,
            fromUser: 'Emma Wilson',
            skillOffered: 'Fitness Training',
            skillWanted: 'French',
            status: 'pending',
            timestamp: '5 hours ago'
        }
    ];

    const mockStats = {
        totalUsers: 1250,
        activeSwaps: 89,
        skillsAvailable: 45,
        successRate: 94.5,
        userStats: {
            skills: 4,
            swaps: 12,
            connections: 8,
            successRate: 95
        }
    };

    res.json({
        users: mockUsers,
        skills: mockSkills,
        activities: mockActivities,
        swapRequests: mockSwapRequests,
        stats: mockStats
    });
});

export default router; 