import { Database } from 'sqlite3';

export interface DatabaseTables {
  users: UserTable;
  skills: SkillTable;
  swapRequests: SwapRequestTable;
  ratings: RatingTable;
  notifications: NotificationTable;
  messages: MessageTable;
  categories: CategoryTable;
  userSessions: UserSessionTable;
  auditLogs: AuditLogTable;
  skillEndorsements: SkillEndorsementTable;
}

export interface UserTable {
  id: number;
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  location: string | null;
  profilePhoto: string | null;
  bio: string | null;
  isPublic: boolean;
  availability: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  gender: 'male' | 'female' | 'other' | null;
  timezone: string | null;
  language: string;
  totalRating: number;
  ratingCount: number;
  averageRating: number;
  completedSwaps: number;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillTable {
  id: number;
  userId: number;
  categoryId: number;
  name: string;
  description: string;
  type: 'offered' | 'wanted';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experienceYears: number;
  isActive: boolean;
  priority: number;
  tags: string; // JSON array of tags
  verificationStatus: 'pending' | 'verified' | 'rejected';
  endorsementCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SwapRequestTable {
  id: number;
  fromUserId: number;
  toUserId: number;
  offeredSkillId: number;
  wantedSkillId: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  scheduledDate: Date | null;
  duration: number | null; // in minutes
  meetingType: 'online' | 'in-person' | 'both';
  meetingLocation: string | null;
  meetingLink: string | null;
  notes: string | null;
  priority: 'low' | 'medium' | 'high';
  expiresAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingTable {
  id: number;
  swapId: number;
  fromUserId: number;
  toUserId: number;
  skillId: number;
  rating: number; // 1-5
  comment: string | null;
  isPublic: boolean;
  categories: string; // JSON: {communication: 5, knowledge: 4, punctuality: 5}
  wouldRecommend: boolean;
  createdAt: Date;
}

export interface NotificationTable {
  id: number;
  userId: number;
  type: 'swap_request' | 'swap_accepted' | 'swap_rejected' | 'swap_completed' | 'rating_received' | 'skill_endorsed' | 'system_message';
  title: string;
  message: string;
  data: string | null; // JSON data
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  expiresAt: Date | null;
  createdAt: Date;
}

export interface MessageTable {
  id: number;
  swapId: number;
  fromUserId: number;
  toUserId: number;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachmentUrl: string | null;
  read: boolean;
  createdAt: Date;
}

export interface CategoryTable {
  id: number;
  name: string;
  description: string;
  icon: string | null;
  color: string | null;
  parentId: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSessionTable {
  id: number;
  userId: number;
  token: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuditLogTable {
  id: number;
  userId: number | null;
  action: string;
  entity: string;
  entityId: number | null;
  oldValues: string | null; // JSON
  newValues: string | null; // JSON
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface SkillEndorsementTable {
  id: number;
  skillId: number;
  endorserId: number;
  endorseeId: number;
  message: string | null;
  isPublic: boolean;
  createdAt: Date;
}

export const createTables = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table with comprehensive fields
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
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

      // Categories table for skill organization
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
          categoryId INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('offered', 'wanted')),
          level TEXT NOT NULL CHECK(level IN ('beginner', 'intermediate', 'advanced', 'expert')),
          experienceYears INTEGER DEFAULT 0,
          isActive BOOLEAN DEFAULT 1,
          priority INTEGER DEFAULT 1,
          tags TEXT, -- JSON array
          verificationStatus TEXT DEFAULT 'pending' CHECK(verificationStatus IN ('pending', 'verified', 'rejected')),
          endorsementCount INTEGER DEFAULT 0,
          viewCount INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE RESTRICT
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
          duration INTEGER, -- in minutes
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
          categories TEXT, -- JSON: {communication: 5, knowledge: 4, punctuality: 5}
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
          data TEXT, -- JSON data
          read BOOLEAN DEFAULT 0,
          priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
          expiresAt DATETIME,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Messages table for swap communication
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

      // User sessions table for security
      db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          deviceInfo TEXT,
          ipAddress TEXT,
          userAgent TEXT,
          isActive BOOLEAN DEFAULT 1,
          expiresAt DATETIME NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Audit logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          action TEXT NOT NULL,
          entity TEXT NOT NULL,
          entityId INTEGER,
          oldValues TEXT, -- JSON
          newValues TEXT, -- JSON
          ipAddress TEXT,
          userAgent TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL
        )
      `);

      // Skill endorsements table
      db.run(`
        CREATE TABLE IF NOT EXISTS skill_endorsements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          skillId INTEGER NOT NULL,
          endorserId INTEGER NOT NULL,
          endorseeId INTEGER NOT NULL,
          message TEXT,
          isPublic BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (skillId) REFERENCES skills (id) ON DELETE CASCADE,
          FOREIGN KEY (endorserId) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (endorseeId) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(skillId, endorserId)
        )
      `);

      // Create comprehensive indexes for performance
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
        'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
        'CREATE INDEX IF NOT EXISTS idx_users_location ON users(location)',
        'CREATE INDEX IF NOT EXISTS idx_users_online ON users(isOnline)',
        
        'CREATE INDEX IF NOT EXISTS idx_skills_userId ON skills(userId)',
        'CREATE INDEX IF NOT EXISTS idx_skills_categoryId ON skills(categoryId)',
        'CREATE INDEX IF NOT EXISTS idx_skills_type ON skills(type)',
        'CREATE INDEX IF NOT EXISTS idx_skills_level ON skills(level)',
        'CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(isActive)',
        'CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name)',
        
        'CREATE INDEX IF NOT EXISTS idx_swap_requests_fromUserId ON swap_requests(fromUserId)',
        'CREATE INDEX IF NOT EXISTS idx_swap_requests_toUserId ON swap_requests(toUserId)',
        'CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status)',
        'CREATE INDEX IF NOT EXISTS idx_swap_requests_scheduledDate ON swap_requests(scheduledDate)',
        
        'CREATE INDEX IF NOT EXISTS idx_ratings_swapId ON ratings(swapId)',
        'CREATE INDEX IF NOT EXISTS idx_ratings_toUserId ON ratings(toUserId)',
        'CREATE INDEX IF NOT EXISTS idx_ratings_fromUserId ON ratings(fromUserId)',
        
        'CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)',
        
        'CREATE INDEX IF NOT EXISTS idx_messages_swapId ON messages(swapId)',
        'CREATE INDEX IF NOT EXISTS idx_messages_fromUserId ON messages(fromUserId)',
        'CREATE INDEX IF NOT EXISTS idx_messages_toUserId ON messages(toUserId)',
        
        'CREATE INDEX IF NOT EXISTS idx_categories_parentId ON categories(parentId)',
        'CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(isActive)',
        
        'CREATE INDEX IF NOT EXISTS idx_sessions_userId ON user_sessions(userId)',
        'CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token)',
        'CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(isActive)',
        
        'CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId)',
        'CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity)',
        'CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt)',
        
        'CREATE INDEX IF NOT EXISTS idx_endorsements_skillId ON skill_endorsements(skillId)',
        'CREATE INDEX IF NOT EXISTS idx_endorsements_endorserId ON skill_endorsements(endorserId)',
        'CREATE INDEX IF NOT EXISTS idx_endorsements_endorseeId ON skill_endorsements(endorseeId)'
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

      defaultCategories.forEach((category, index) => {
        db.run(`
          INSERT OR IGNORE INTO categories (name, description, icon, color, sortOrder)
          VALUES (?, ?, ?, ?, ?)
        `, [category.name, category.description, category.icon, category.color, index]);
      });

      resolve();
    });

    db.on('error', (err) => {
      reject(err);
    });
  });
};