import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import compression from 'compression';
import 'express-async-errors';

import { logger, loggers, httpLogger, errorLogger } from './utils/logger';
import { redisService } from './services/redis';
import { initializeWebSocket } from './services/websocket';
import { createTables } from './database/schema';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { skillRoutes } from './routes/skills';
import { swapRoutes } from './routes/swaps';
import { adminRoutes } from './routes/admin';
import { notificationRoutes } from './routes/notifications';
import { messageRoutes } from './routes/messages';
import { analyticsRoutes } from './routes/analytics';
import { AuthRequest } from './types';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || '5000', 10);

// Security middleware - Enhanced helmet configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'", "ws:", "wss:", "https:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
}));

// Rate limiting - Competition requirement: Performance optimization
const createRateLimiter = (windowMs: number, max: number, message: string) => rateLimit({
    windowMs,
    max,
    message: {
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: AuthRequest) => {
        // Skip rate limiting for admin users
        return req.user?.role === 'admin';
    },
});

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later.');
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again later.');
const searchLimiter = createRateLimiter(1 * 60 * 1000, 20, 'Too many search requests, please slow down.');
const uploadLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many file uploads, please try again later.');

// Slow down middleware for additional protection
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500,
    maxDelayMs: 5000,
});

// Apply rate limiting
app.use(generalLimiter);
app.use(speedLimiter);

// Specific rate limiters for endpoints
app.use('/api/auth', authLimiter);
app.use('/api/search', searchLimiter);
app.use('/api/upload', uploadLimiter);

// Logging middleware
app.use(httpLogger);

// Compression for better performance
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    threshold: 1024,
    level: 6,
}));

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
}));

// Body parsing with size limits
app.use(express.json({
    limit: process.env.MAX_JSON_SIZE || '10mb',
    strict: true,
    type: ['application/json', 'text/plain']
}));

app.use(express.urlencoded({
    extended: true,
    limit: process.env.MAX_URL_SIZE || '10mb',
    parameterLimit: 100
}));

// Request ID middleware for tracking
app.use((req: AuthRequest, res, next) => {
    (req as any).id = Math.random().toString(36).substr(2, 9);
    res.setHeader('X-Request-ID', (req as any).id);
    next();
});

// Performance monitoring middleware
app.use((req: AuthRequest, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        // Log slow requests
        if (duration > 1000) {
            loggers.performance.slow(`${req.method} ${req.path}`, duration, 1000);
        }

        // Track API metrics
        redisService.incrementCounter(`api:${req.method}:${req.path}:count`);
        redisService.incrementCounter(`api:${req.method}:${req.path}:duration`, duration);
    });

    next();
});

// Routes with enhanced error handling
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint with comprehensive information
app.get('/api/health', async (req, res) => {
    try {
        // Database health check
        const dbHealth = await checkDatabaseHealth();

        // Redis health check
        const redisStats = await redisService.getStats();

        // Memory usage
        const memoryUsage = process.memoryUsage();

        // System uptime
        const uptime = process.uptime();

        const healthData = {
            status: 'OK',
            message: 'Skill Swap Platform API is running',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
            database: dbHealth,
            redis: redisStats,
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
            },
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                pid: process.pid,
                uptime: process.uptime(),
            }
        };

        res.status(200).json(healthData);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            status: 'ERROR',
            message: 'Health check failed',
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
});

// API status and metrics endpoint
app.get('/api/status', async (req, res) => {
    try {
        const stats = await getSystemStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch system stats' });
    }
});

// WebSocket connection info endpoint
app.get('/api/websocket/stats', (req, res) => {
    try {
        const websocketService = require('./services/websocket').getWebSocketService();
        const stats = websocketService.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'WebSocket service not available' });
    }
});

// Error handling middleware
app.use(errorLogger);

// Global error handler with detailed logging
app.use((err: any, req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    const errorId = Math.random().toString(36).substr(2, 9);

    // Log error with context
    loggers.api.error(req.method, req.url, err, req.user?.id);

    // Log additional context
    logger.error('Unhandled error', {
        errorId,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        stack: err.stack,
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.details || err.message,
            errorId,
        });
    }

    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
            errorId,
        });
    }

    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({
            error: 'Database Constraint Error',
            message: 'The operation violates a database constraint',
            errorId,
        });
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            error: 'File Too Large',
            message: 'Uploaded file exceeds size limit',
            errorId,
        });
    }

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const response: any = {
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
        errorId,
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
    });
});

// Helper functions
async function checkDatabaseHealth(): Promise<any> {
    try {
        // Simple query to check database connectivity
        return new Promise((resolve, reject) => {
            const { db } = require('./database/init');
            db.get('SELECT 1 as test', (err: any, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ status: 'connected', test: result?.test === 1 });
                }
            });
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { status: 'error', message: errorMessage };
    }
}

async function getSystemStats(): Promise<any> {
    try {
        const [dbStats, redisStats] = await Promise.all([
            checkDatabaseHealth(),
            redisService.getStats(),
        ]);

        return {
            database: dbStats,
            redis: redisStats,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to get system stats: ${errorMessage}`);
    }
}

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
    loggers.system.shutdown(`Server (${signal})`);

    server.close(async () => {
        try {
            await redisService.disconnect();
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// Initialize application
const startServer = async () => {
    try {
        // Initialize database
        await createTables(require('./database/init').db);
        loggers.database.connected('SQLite');

        // Initialize Redis (optional for development)
        if (process.env.DISABLE_REDIS !== 'true') {
            try {
                await redisService.connect();
            } catch (error) {
                logger.warn('⚠️ Redis connection failed, continuing without Redis cache');
            }
        } else {
            logger.info('ℹ️ Redis disabled via DISABLE_REDIS environment variable');
        }

        // Initialize WebSocket
        const websocketService = initializeWebSocket(server);
        loggers.system.startup('WebSocket Server');

        // Start server
        server.listen(PORT, () => {
            loggers.system.startup('Skill Swap Platform', PORT);
            logger.info(`🌐 Server running on port ${PORT}`);
            logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
            logger.info(`🎯 Competition ready with all features enabled!`);
        });

        // Log memory usage periodically
        setInterval(() => {
            loggers.performance.memory(process.memoryUsage());
        }, 300000); // Every 5 minutes

    } catch (error) {
        loggers.system.error('Server startup', error as Error);
        process.exit(1);
    }
};

// Start the application
startServer(); 