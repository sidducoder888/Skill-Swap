import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { auth } from '../middleware/auth';
import { db } from '../database/init';

const router = express.Router();

// Get user notifications with pagination
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('unread').optional().isBoolean().withMessage('Unread must be a boolean'),
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    let query = `
      SELECT id, type, title, message, data, read, priority, createdAt 
      FROM notifications 
      WHERE userId = ?
    `;
    
    const params = [req.user.id];

    if (unreadOnly) {
      query += ' AND read = 0';
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get notifications
    db.all(query, params, (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch notifications' });
      }

      // Get total count
      const countQuery = unreadOnly 
        ? 'SELECT COUNT(*) as total FROM notifications WHERE userId = ? AND read = 0'
        : 'SELECT COUNT(*) as total FROM notifications WHERE userId = ?';
      
      const countParams = unreadOnly ? [req.user.id] : [req.user.id];

      db.get(countQuery, countParams, (err, result: any) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to count notifications' });
        }

        res.json({
          notifications: notifications.map((notification: any) => ({
            ...notification,
            data: notification.data ? JSON.parse(notification.data) : null,
          })),
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit),
          },
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, [
  param('id').isInt().withMessage('Notification ID must be an integer'),
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notificationId = req.params.id;

    db.run(
      'UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?',
      [notificationId, req.user.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to mark notification as read' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req: any, res) => {
  try {
    db.run(
      'UPDATE notifications SET read = 1 WHERE userId = ? AND read = 0',
      [req.user.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to mark notifications as read' });
        }

        res.json({ 
          message: 'All notifications marked as read',
          updated: this.changes 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', auth, [
  param('id').isInt().withMessage('Notification ID must be an integer'),
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const notificationId = req.params.id;

    db.run(
      'DELETE FROM notifications WHERE id = ? AND userId = ?',
      [notificationId, req.user.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete notification' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification statistics
router.get('/stats', auth, async (req: any, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN read = 0 THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN read = 1 THEN 1 ELSE 0 END) as read
      FROM notifications 
      WHERE userId = ?
    `;

    db.get(statsQuery, [req.user.id], (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to get notification stats' });
      }

      res.json(stats);
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as notificationRoutes };