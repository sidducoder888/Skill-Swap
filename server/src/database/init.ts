import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(__dirname, '../../data/skillswap.db');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table with enhanced fields
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT NOT NULL,
                    firstName TEXT NOT NULL DEFAULT '',
                    lastName TEXT NOT NULL DEFAULT '',
                    location TEXT,
                    profilePhoto TEXT,
                    bio TEXT,
                    isPublic BOOLEAN DEFAULT 1,
                    availability TEXT DEFAULT 'Weekends',
                    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'moderator')),
                    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
                    emailVerified BOOLEAN DEFAULT 0,
                    phoneNumber TEXT,
                    dateOfBirth DATE,
                    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
                    timezone TEXT DEFAULT 'UTC',
                    language TEXT DEFAULT 'en',
                    totalRating INTEGER DEFAULT 0,
                    ratingCount INTEGER DEFAULT 0,
                    averageRating REAL DEFAULT 0.0,
                    completedSwaps INTEGER DEFAULT 0,
                    isOnline BOOLEAN DEFAULT 0,
                    lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Categories table
            db.run(`
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    icon TEXT,
                    color TEXT,
                    parentId INTEGER,
                    isActive BOOLEAN DEFAULT 1,
                    sortOrder INTEGER DEFAULT 0,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parentId) REFERENCES categories (id) ON DELETE SET NULL
                )
            `);

            // Enhanced skills table
            db.run(`
                CREATE TABLE IF NOT EXISTS skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER NOT NULL,
                    categoryId INTEGER DEFAULT 1,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('offered', 'wanted')),
                    level TEXT NOT NULL CHECK(level IN ('beginner', 'intermediate', 'advanced', 'expert')),
                    experienceYears INTEGER DEFAULT 0,
                    isActive BOOLEAN DEFAULT 1,
                    priority INTEGER DEFAULT 1,
                    tags TEXT DEFAULT '[]',
                    verificationStatus TEXT DEFAULT 'pending' CHECK(verificationStatus IN ('pending', 'verified', 'rejected')),
                    endorsementCount INTEGER DEFAULT 0,
                    viewCount INTEGER DEFAULT 0,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL
                )
            `);

            // Enhanced swap requests table
            db.run(`
                CREATE TABLE IF NOT EXISTS swap_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fromUserId INTEGER NOT NULL,
                    toUserId INTEGER NOT NULL,
                    offeredSkillId INTEGER NOT NULL,
                    wantedSkillId INTEGER NOT NULL,
                    message TEXT,
                    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
                    scheduledDate DATETIME,
                    duration INTEGER,
                    meetingType TEXT DEFAULT 'online' CHECK(meetingType IN ('online', 'in-person', 'both')),
                    meetingLocation TEXT,
                    meetingLink TEXT,
                    notes TEXT,
                    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
                    expiresAt DATETIME,
                    completedAt DATETIME,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (fromUserId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (toUserId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (offeredSkillId) REFERENCES skills (id) ON DELETE CASCADE,
                    FOREIGN KEY (wantedSkillId) REFERENCES skills (id) ON DELETE CASCADE
                )
            `);

            // Enhanced ratings table
            db.run(`
                CREATE TABLE IF NOT EXISTS ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    swapId INTEGER NOT NULL,
                    fromUserId INTEGER NOT NULL,
                    toUserId INTEGER NOT NULL,
                    skillId INTEGER NOT NULL,
                    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                    comment TEXT,
                    isPublic BOOLEAN DEFAULT 1,
                    categories TEXT DEFAULT '{}',
                    wouldRecommend BOOLEAN DEFAULT 1,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (swapId) REFERENCES swap_requests (id) ON DELETE CASCADE,
                    FOREIGN KEY (fromUserId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (toUserId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (skillId) REFERENCES skills (id) ON DELETE CASCADE
                )
            `);

            // Notifications table
            db.run(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('swap_request', 'swap_accepted', 'swap_rejected', 'swap_completed', 'rating_received', 'skill_endorsed', 'system_message')),
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    data TEXT DEFAULT '{}',
                    read BOOLEAN DEFAULT 0,
                    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
                    expiresAt DATETIME,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
                    read BOOLEAN DEFAULT 0,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (swapId) REFERENCES swap_requests (id) ON DELETE CASCADE,
                    FOREIGN KEY (fromUserId) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (toUserId) REFERENCES users (id) ON DELETE CASCADE
                )
            `);

            // Create indexes for performance
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
                'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
                'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
                'CREATE INDEX IF NOT EXISTS idx_skills_userId ON skills(userId)',
                'CREATE INDEX IF NOT EXISTS idx_skills_categoryId ON skills(categoryId)',
                'CREATE INDEX IF NOT EXISTS idx_skills_type ON skills(type)',
                'CREATE INDEX IF NOT EXISTS idx_skills_level ON skills(level)',
                'CREATE INDEX IF NOT EXISTS idx_swap_requests_fromUserId ON swap_requests(fromUserId)',
                'CREATE INDEX IF NOT EXISTS idx_swap_requests_toUserId ON swap_requests(toUserId)',
                'CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status)',
                'CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId)',
                'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
                'CREATE INDEX IF NOT EXISTS idx_messages_swapId ON messages(swapId)',
            ];

            indexes.forEach(indexQuery => {
                db.run(indexQuery);
            });

            // Insert default categories
            const defaultCategories = [
                { name: 'Technology', description: 'Programming, Software, Hardware', icon: '💻', color: '#3B82F6' },
                { name: 'Design', description: 'UI/UX, Graphics, Web Design', icon: '🎨', color: '#8B5CF6' },
                { name: 'Business', description: 'Marketing, Sales, Management', icon: '💼', color: '#059669' },
                { name: 'Language', description: 'English, Spanish, French, etc.', icon: '🗣️', color: '#DC2626' },
                { name: 'Music', description: 'Instruments, Theory, Production', icon: '🎵', color: '#7C2D12' },
                { name: 'Sports', description: 'Fitness, Games, Training', icon: '⚽', color: '#EA580C' },
                { name: 'Cooking', description: 'Recipes, Techniques, Cuisines', icon: '🍳', color: '#65A30D' },
                { name: 'Academic', description: 'Math, Science, Literature', icon: '📚', color: '#1D4ED8' },
                { name: 'Arts & Crafts', description: 'Painting, Sculpting, DIY', icon: '🖌️', color: '#BE185D' },
                { name: 'Other', description: 'Miscellaneous Skills', icon: '🌟', color: '#6B7280' }
            ];

            let categoriesInserted = 0;
            defaultCategories.forEach((category, index) => {
                db.run(`
                    INSERT OR IGNORE INTO categories (name, description, icon, color, sortOrder)
                    VALUES (?, ?, ?, ?, ?)
                `, [category.name, category.description, category.icon, category.color, index], function() {
                    categoriesInserted++;
                    if (categoriesInserted === defaultCategories.length) {
                        // Insert default admin user after categories are done
                        insertDefaultAdmin();
                    }
                });
            });

            function insertDefaultAdmin() {
                db.get('SELECT id FROM users WHERE email = ?', ['admin@skillswap.com'], (err, row) => {
                    if (!row) {
                        const hashedPassword = bcrypt.hashSync('admin123', 12);
                        db.run(`
                            INSERT INTO users (email, password, name, firstName, lastName, role, isPublic, emailVerified)
                            VALUES (?, ?, ?, ?, ?, 'admin', 1, 1)
                        `, ['admin@skillswap.com', hashedPassword, 'Admin User', 'Admin', 'User'], function() {
                            console.log('✅ Default admin user created');
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            }
        });

        db.on('error', (err) => {
            reject(err);
        });
    });
}; 