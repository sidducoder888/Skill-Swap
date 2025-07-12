import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    if (info.stack) {
      return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Define different transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: format,
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper functions for structured logging
export const loggers = {
  // System events
  system: {
    startup: (service: string, port?: number) => {
      logger.info(`🚀 ${service} started successfully`, { 
        service, 
        port, 
        timestamp: new Date().toISOString() 
      });
    },
    shutdown: (service: string) => {
      logger.info(`🛑 ${service} shutting down`, { 
        service, 
        timestamp: new Date().toISOString() 
      });
    },
    error: (service: string, error: Error) => {
      logger.error(`❌ ${service} error: ${error.message}`, {
        service,
        error: error.stack,
        timestamp: new Date().toISOString()
      });
    },
  },

  // Database events
  database: {
    connected: (type: string) => {
      logger.info(`✅ Database connected: ${type}`, { 
        database: type, 
        timestamp: new Date().toISOString() 
      });
    },
    disconnected: (type: string) => {
      logger.info(`📴 Database disconnected: ${type}`, { 
        database: type, 
        timestamp: new Date().toISOString() 
      });
    },
    query: (query: string, duration: number) => {
      logger.debug(`🔍 Database query executed`, {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    },
    error: (query: string, error: Error) => {
      logger.error(`❌ Database query failed: ${error.message}`, {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        error: error.stack,
        timestamp: new Date().toISOString()
      });
    },
  },

  // API events
  api: {
    request: (method: string, url: string, userId?: number) => {
      logger.http(`📥 ${method} ${url}`, {
        method,
        url,
        userId,
        timestamp: new Date().toISOString()
      });
    },
    response: (method: string, url: string, status: number, duration: number) => {
      const emoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
      logger.http(`📤 ${emoji} ${method} ${url} - ${status} (${duration}ms)`, {
        method,
        url,
        status,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    },
    error: (method: string, url: string, error: Error, userId?: number) => {
      logger.error(`❌ API Error: ${method} ${url} - ${error.message}`, {
        method,
        url,
        userId,
        error: error.stack,
        timestamp: new Date().toISOString()
      });
    },
  },

  // Authentication events
  auth: {
    login: (userId: number, email: string, ip: string) => {
      logger.info(`🔐 User logged in`, {
        userId,
        email,
        ip,
        timestamp: new Date().toISOString()
      });
    },
    logout: (userId: number, email: string) => {
      logger.info(`🚪 User logged out`, {
        userId,
        email,
        timestamp: new Date().toISOString()
      });
    },
    register: (userId: number, email: string, ip: string) => {
      logger.info(`👤 New user registered`, {
        userId,
        email,
        ip,
        timestamp: new Date().toISOString()
      });
    },
    failed: (email: string, ip: string, reason: string) => {
      logger.warn(`🚫 Authentication failed`, {
        email,
        ip,
        reason,
        timestamp: new Date().toISOString()
      });
    },
  },

  // Cache events
  cache: {
    hit: (key: string) => {
      logger.debug(`💾 Cache HIT: ${key}`, {
        key,
        type: 'hit',
        timestamp: new Date().toISOString()
      });
    },
    miss: (key: string) => {
      logger.debug(`💨 Cache MISS: ${key}`, {
        key,
        type: 'miss',
        timestamp: new Date().toISOString()
      });
    },
    set: (key: string, ttl: number) => {
      logger.debug(`💾 Cache SET: ${key} (TTL: ${ttl}s)`, {
        key,
        ttl,
        type: 'set',
        timestamp: new Date().toISOString()
      });
    },
    delete: (key: string) => {
      logger.debug(`🗑️ Cache DELETE: ${key}`, {
        key,
        type: 'delete',
        timestamp: new Date().toISOString()
      });
    },
  },

  // WebSocket events
  websocket: {
    connected: (userId: number, socketId: string) => {
      logger.info(`🔌 WebSocket connected`, {
        userId,
        socketId,
        timestamp: new Date().toISOString()
      });
    },
    disconnected: (userId: number, socketId: string) => {
      logger.info(`🔌 WebSocket disconnected`, {
        userId,
        socketId,
        timestamp: new Date().toISOString()
      });
    },
    message: (userId: number, event: string, data: any) => {
      logger.debug(`📨 WebSocket message`, {
        userId,
        event,
        data: typeof data === 'object' ? JSON.stringify(data) : data,
        timestamp: new Date().toISOString()
      });
    },
    error: (userId: number, error: Error) => {
      logger.error(`❌ WebSocket error`, {
        userId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    },
  },

  // Security events
  security: {
    rateLimit: (ip: string, endpoint: string) => {
      logger.warn(`🚫 Rate limit exceeded`, {
        ip,
        endpoint,
        timestamp: new Date().toISOString()
      });
    },
    suspiciousActivity: (userId: number, activity: string, details: any) => {
      logger.warn(`🔍 Suspicious activity detected`, {
        userId,
        activity,
        details,
        timestamp: new Date().toISOString()
      });
    },
    blocked: (ip: string, reason: string) => {
      logger.warn(`🚫 IP blocked`, {
        ip,
        reason,
        timestamp: new Date().toISOString()
      });
    },
  },

  // Performance events
  performance: {
    slow: (operation: string, duration: number, threshold: number) => {
      logger.warn(`🐌 Slow operation detected`, {
        operation,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        timestamp: new Date().toISOString()
      });
    },
    memory: (usage: NodeJS.MemoryUsage) => {
      logger.debug(`📊 Memory usage`, {
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`,
        timestamp: new Date().toISOString()
      });
    },
  },
};

// Export the main logger instance
export { logger };

// Export a middleware function for Express
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  // Log the request
  loggers.api.request(req.method, req.url, req.user?.id);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const duration = Date.now() - start;
    loggers.api.response(req.method, req.url, res.statusCode, duration);
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Export error logger
export const errorLogger = (error: Error, req: any, res: any, next: any) => {
  loggers.api.error(req.method, req.url, error, req.user?.id);
  next(error);
};

// Create a child logger for specific modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Performance monitoring
export const performanceLogger = {
  startTimer: (operation: string) => {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        if (duration > 1000) { // Log if operation takes more than 1 second
          loggers.performance.slow(operation, duration, 1000);
        }
        return duration;
      }
    };
  }
};

// Log system startup
logger.info('📋 Logger initialized', {
  level: process.env.LOG_LEVEL || 'info',
  transports: transports.length,
  timestamp: new Date().toISOString()
});

export default logger;