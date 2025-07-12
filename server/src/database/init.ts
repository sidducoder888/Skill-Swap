import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/skillswap.db');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table
            db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          location TEXT,
          profilePhoto TEXT,
          isPublic BOOLEAN DEFAULT 1,
          availability TEXT DEFAULT 'Weekends',
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
          description TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('offered', 'wanted')),
          level TEXT NOT NULL CHECK(level IN ('beginner', 'intermediate', 'advanced')),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled')),
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

            // Create indexes for better performance
            db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
            db.run('CREATE INDEX IF NOT EXISTS idx_skills_userId ON skills(userId)');
            db.run('CREATE INDEX IF NOT EXISTS idx_skills_type ON skills(type)');
            db.run('CREATE INDEX IF NOT EXISTS idx_swap_requests_fromUserId ON swap_requests(fromUserId)');
            db.run('CREATE INDEX IF NOT EXISTS idx_swap_requests_toUserId ON swap_requests(toUserId)');
            db.run('CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status)');

            // Insert default admin user if not exists
            db.get('SELECT id FROM users WHERE email = ?', ['admin@skillswap.com'], (err, row) => {
                if (!row) {
                    const bcrypt = require('bcryptjs');
                    const hashedPassword = bcrypt.hashSync('admin123', 10);
                    db.run(`
            INSERT INTO users (email, password, name, role, isPublic)
            VALUES (?, ?, ?, 'admin', 1)
          `, ['admin@skillswap.com', hashedPassword, 'Admin User']);
                }
                resolve();
            });
        });

        db.on('error', (err) => {
            reject(err);
        });
    });
}; 