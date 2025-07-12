import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
const dbPath = path.join(__dirname, '../../data/skillswap.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('✅ Database connected: SQLite');
        // Initialize tables first, then seed data
        initializeDatabase().then(() => {
            seedFakeData();
        });
    }
});

export const initializeDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Create tables
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT NOT NULL,
                    location TEXT,
                    availability TEXT,
                    profilePhoto TEXT,
                    isPublic INTEGER DEFAULT 1,
                    role TEXT DEFAULT 'user',
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Skills table
            db.run(`
                CREATE TABLE IF NOT EXISTS skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    type TEXT NOT NULL CHECK(type IN ('offered', 'wanted')),
                    level TEXT DEFAULT 'beginner' CHECK(level IN ('beginner', 'intermediate', 'advanced')),
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
                )
            `);

            // Swap requests table
            db.run(`
                CREATE TABLE IF NOT EXISTS swap_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fromUserId INTEGER NOT NULL,
                    toUserId INTEGER NOT NULL,
                    offeredSkillId INTEGER NOT NULL,
                    wantedSkillId INTEGER NOT NULL,
                    message TEXT,
                    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (fromUserId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (toUserId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (offeredSkillId) REFERENCES skills (id) ON DELETE CASCADE,
                    FOREIGN KEY (wantedSkillId) REFERENCES skills (id) ON DELETE CASCADE
                )
            `);

            // Ratings table
            db.run(`
                CREATE TABLE IF NOT EXISTS ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    swapId INTEGER NOT NULL,
                    fromUserId INTEGER NOT NULL,
                    toUserId INTEGER NOT NULL,
                    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                    comment TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (swapId) REFERENCES swap_requests (id) ON DELETE CASCADE,
                    FOREIGN KEY (fromUserId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (toUserId) REFERENCES users (id) ON DELETE CASCADE
                )
            `);

            // Notifications table
            db.run(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    data TEXT,
                    read INTEGER DEFAULT 0,
                    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
                )
            `);

            // Messages table
            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    swapId INTEGER NOT NULL,
                    fromUserId INTEGER NOT NULL,
                    toUserId INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    messageType TEXT DEFAULT 'text' CHECK(messageType IN ('text', 'image', 'file', 'system')),
                    attachmentUrl TEXT,
                    read INTEGER DEFAULT 0,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (swapId) REFERENCES swap_requests (id) ON DELETE CASCADE,
                    FOREIGN KEY (fromUserId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (toUserId) REFERENCES users (id) ON DELETE CASCADE
                )
            `);

            console.log('✅ Database tables created successfully');
            resolve();
        });
    });
};

// Seed fake data for testing
function seedFakeData() {
    // Check if data already exists
    db.get('SELECT COUNT(*) as count FROM users', (err, result: any) => {
        if (err) {
            console.error('Error checking users:', err);
            return;
        }

        if (result.count > 0) {
            console.log('📊 Database already has data, skipping seed');
            return;
        }

        console.log('🌱 Seeding fake data...');

        // Insert fake users
        const fakeUsers = [
            {
                id: 1,
                email: 'test@test.com',
                password: '$2a$10$test', // bcrypt hash for 'test123'
                name: 'Test User',
                location: 'Test City',
                availability: 'Available',
                isPublic: 1,
                role: 'user',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                email: 'sarah@example.com',
                password: '$2a$10$test',
                name: 'Sarah Johnson',
                location: 'New York, NY',
                availability: 'Weekends',
                isPublic: 1,
                role: 'user',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                email: 'mike@example.com',
                password: '$2a$10$test',
                name: 'Mike Chen',
                location: 'San Francisco, CA',
                availability: 'Evenings',
                isPublic: 1,
                role: 'user',
                createdAt: new Date().toISOString()
            },
            {
                id: 4,
                email: 'maria@example.com',
                password: '$2a$10$test',
                name: 'Maria Garcia',
                location: 'Los Angeles, CA',
                availability: 'Flexible',
                isPublic: 1,
                role: 'user',
                createdAt: new Date().toISOString()
            },
            {
                id: 5,
                email: 'alex@example.com',
                password: '$2a$10$test',
                name: 'Alex Thompson',
                location: 'Chicago, IL',
                availability: 'Weekdays',
                isPublic: 1,
                role: 'user',
                createdAt: new Date().toISOString()
            }
        ];

        // Insert users
        fakeUsers.forEach(user => {
            const nameParts = user.name.split(' ');
            db.run(`
                INSERT INTO users (id, email, password, name, firstName, lastName, location, availability, isPublic, role, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [user.id, user.email, user.password, user.name, nameParts[0] || '', nameParts.slice(1).join(' ') || '', user.location, user.availability, user.isPublic, user.role, user.createdAt]);
        });

        // Insert fake categories first
        const fakeCategories = [
            { id: 1, name: 'Programming', description: 'Software development and coding', icon: 'code', color: '#3B82F6' },
            { id: 2, name: 'Language', description: 'Language learning and teaching', icon: 'language', color: '#10B981' },
            { id: 3, name: 'Creative', description: 'Arts and creative skills', icon: 'brush', color: '#F59E0B' },
            { id: 4, name: 'Lifestyle', description: 'Life skills and hobbies', icon: 'restaurant', color: '#EF4444' },
            { id: 5, name: 'Music', description: 'Musical instruments and skills', icon: 'music_note', color: '#8B5CF6' },
            { id: 6, name: 'Health', description: 'Fitness and wellness', icon: 'fitness_center', color: '#06B6D4' }
        ];

        fakeCategories.forEach(category => {
            db.run(`
                INSERT INTO categories (id, name, description, icon, color, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [category.id, category.name, category.description, category.icon, category.color, new Date().toISOString()]);
        });

        // Insert fake skills with category IDs
        const fakeSkills = [
            { id: 1, userId: 1, categoryId: 1, name: 'JavaScript', description: 'Advanced JavaScript programming', type: 'offered', level: 'advanced' },
            { id: 2, userId: 1, categoryId: 1, name: 'React', description: 'React development', type: 'offered', level: 'intermediate' },
            { id: 3, userId: 1, categoryId: 2, name: 'Spanish', description: 'Spanish language learning', type: 'wanted', level: 'beginner' },
            { id: 4, userId: 2, categoryId: 3, name: 'Photography', description: 'Professional photography', type: 'offered', level: 'advanced' },
            { id: 5, userId: 2, categoryId: 1, name: 'Web Development', description: 'Full-stack web development', type: 'wanted', level: 'intermediate' },
            { id: 6, userId: 3, categoryId: 4, name: 'Cooking', description: 'Chinese cuisine cooking', type: 'offered', level: 'intermediate' },
            { id: 7, userId: 3, categoryId: 3, name: 'Graphic Design', description: 'Digital design skills', type: 'wanted', level: 'beginner' },
            { id: 8, userId: 4, categoryId: 2, name: 'Spanish', description: 'Spanish language teaching', type: 'offered', level: 'advanced' },
            { id: 9, userId: 4, categoryId: 1, name: 'JavaScript', description: 'JavaScript programming', type: 'wanted', level: 'intermediate' },
            { id: 10, userId: 5, categoryId: 1, name: 'React', description: 'React development', type: 'offered', level: 'intermediate' },
            { id: 11, userId: 5, categoryId: 1, name: 'Python', description: 'Python programming', type: 'offered', level: 'intermediate' },
            { id: 12, userId: 5, categoryId: 5, name: 'Guitar', description: 'Guitar playing', type: 'wanted', level: 'beginner' }
        ];

        fakeSkills.forEach(skill => {
            db.run(`
                INSERT INTO skills (id, userId, categoryId, name, description, type, level, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [skill.id, skill.userId, skill.categoryId, skill.name, skill.description, skill.type, skill.level, new Date().toISOString()]);
        });

        // Insert fake swap requests
        const fakeSwaps = [
            {
                id: 1,
                fromUserId: 2,
                toUserId: 1,
                offeredSkillId: 4,
                wantedSkillId: 1,
                message: 'I can teach you photography in exchange for JavaScript lessons',
                status: 'pending',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                fromUserId: 3,
                toUserId: 4,
                offeredSkillId: 6,
                wantedSkillId: 8,
                message: 'I can teach you cooking in exchange for Spanish lessons',
                status: 'pending',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                fromUserId: 5,
                toUserId: 2,
                offeredSkillId: 10,
                wantedSkillId: 4,
                message: 'I can teach you React in exchange for photography lessons',
                status: 'accepted',
                createdAt: new Date().toISOString()
            }
        ];

        fakeSwaps.forEach(swap => {
            db.run(`
                INSERT INTO swap_requests (id, fromUserId, toUserId, offeredSkillId, wantedSkillId, message, status, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [swap.id, swap.fromUserId, swap.toUserId, swap.offeredSkillId, swap.wantedSkillId, swap.message, swap.status, swap.createdAt]);
        });

        // Insert fake notifications
        const fakeNotifications = [
            {
                id: 1,
                userId: 1,
                type: 'swap_request',
                title: 'New Swap Request',
                message: 'Sarah wants to swap Photography for JavaScript',
                data: JSON.stringify({ swapId: 1 }),
                read: 0,
                priority: 'high',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                userId: 4,
                type: 'swap_request',
                title: 'New Swap Request',
                message: 'Mike wants to swap Cooking for Spanish',
                data: JSON.stringify({ swapId: 2 }),
                read: 0,
                priority: 'medium',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                userId: 2,
                type: 'swap_accepted',
                title: 'Swap Accepted',
                message: 'Alex accepted your React for Photography swap',
                data: JSON.stringify({ swapId: 3 }),
                read: 1,
                priority: 'high',
                createdAt: new Date().toISOString()
            }
        ];

        fakeNotifications.forEach(notification => {
            db.run(`
                INSERT INTO notifications (id, userId, type, title, message, data, read, priority, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [notification.id, notification.userId, notification.type, notification.title, notification.message, notification.data, notification.read, notification.priority, notification.createdAt]);
        });

        console.log('✅ Fake data seeded successfully!');
    });
} 