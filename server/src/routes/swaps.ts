import { getWebSocketService } from '../services/websocket';
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest, CreateSwapRequest, UpdateSwapRequest, CreateRatingRequest } from '../types';

const router = Router();

// Create a swap request
router.post('/', authenticateToken, [
    body('toUserId').isInt({ min: 1 }),
    body('offeredSkillId').isInt({ min: 1 }),
    body('wantedSkillId').isInt({ min: 1 }),
    body('message').optional().trim().isLength({ max: 500 })
], (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const { toUserId, offeredSkillId, wantedSkillId, message }: CreateSwapRequest = req.body;

    // Check if user is trying to swap with themselves
    if (toUserId === req.user.id) {
        return res.status(400).json({ error: 'Cannot create swap request with yourself' });
    }

    // Check if skills belong to the correct users
    db.get(`
    SELECT s1.userId as offeredUserId, s2.userId as wantedUserId
    FROM skills s1, skills s2
    WHERE s1.id = ? AND s2.id = ?
  `, [offeredSkillId, wantedSkillId], (err, skills) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!skills) {
            return res.status(400).json({ error: 'One or both skills not found' });
        }

        if ((skills as any).offeredUserId !== req.user?.id) {
            return res.status(400).json({ error: 'Offered skill must belong to you' });
        }

        if ((skills as any).wantedUserId !== toUserId) {
            return res.status(400).json({ error: 'Wanted skill must belong to the target user' });
        }

        // Check if swap request already exists
        db.get(`
      SELECT id FROM swap_requests 
      WHERE fromUserId = ? AND toUserId = ? AND offeredSkillId = ? AND wantedSkillId = ? AND status = 'pending'
    `, [req.user!.id, toUserId, offeredSkillId, wantedSkillId], (err, existingSwap) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingSwap) {
                return res.status(400).json({ error: 'Swap request already exists' });
            }

            // Create swap request
            db.run(`
        INSERT INTO swap_requests (fromUserId, toUserId, offeredSkillId, wantedSkillId, message)
        VALUES (?, ?, ?, ?, ?)
      `, [req.user!.id, toUserId, offeredSkillId, wantedSkillId, message], function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create swap request' });
                }

                // WebSocket notification temporarily disabled
                // const wsService = getWebSocketService();
                // const notification = {
                //     type: 'swap_request' as const,
                //     title: 'New Swap Request',
                //     message: `You have a new swap request from ${req.user?.name}.`,
                //     data: { swapId: this.lastID },
                // };
                // wsService.notifyUser(toUserId, notification);

                res.status(201).json({
                    message: 'Swap request created successfully',
                    swapId: this.lastID
                });
            });
        });
    });
});

// Get user's swap requests
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    db.all(`
    SELECT sr.*,
           u1.name as fromUserName, u1.profilePhoto as fromUserPhoto,
           u2.name as toUserName, u2.profilePhoto as toUserPhoto,
           s1.name as offeredSkillName,
           s2.name as wantedSkillName
    FROM swap_requests sr
    JOIN users u1 ON sr.fromUserId = u1.id
    JOIN users u2 ON sr.toUserId = u2.id
    JOIN skills s1 ON sr.offeredSkillId = s1.id
    JOIN skills s2 ON sr.wantedSkillId = s2.id
    WHERE sr.fromUserId = ? OR sr.toUserId = ?
    ORDER BY sr.createdAt DESC
  `, [req.user.id, req.user.id], (err, swaps) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ swaps });
    });
});

// Get swap request by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const swapId = parseInt(req.params.id);

    db.get(`
    SELECT sr.*, 
           u1.name as fromUserName, u1.profilePhoto as fromUserPhoto,
           u2.name as toUserName, u2.profilePhoto as toUserPhoto,
           s1.name as offeredSkillName, s1.description as offeredSkillDescription,
           s2.name as wantedSkillName, s2.description as wantedSkillDescription
    FROM swap_requests sr
    JOIN users u1 ON sr.fromUserId = u1.id
    JOIN users u2 ON sr.toUserId = u2.id
    JOIN skills s1 ON sr.offeredSkillId = s1.id
    JOIN skills s2 ON sr.wantedSkillId = s2.id
    WHERE sr.id = ? AND (sr.fromUserId = ? OR sr.toUserId = ?)
  `, [swapId, req.user.id, req.user.id], (err, swap) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!swap) {
            return res.status(404).json({ error: 'Swap request not found' });
        }

        res.json({ swap });
    });
});

// Update swap request status (accept/reject/cancel)
router.put('/:id/status', authenticateToken, [
    body('status').isIn(['accepted', 'rejected', 'cancelled'])
], (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const swapId = parseInt(req.params.id);
    const { status }: UpdateSwapRequest = req.body;

    // Check if user can update this swap request
    db.get(`
    SELECT fromUserId, toUserId, status as currentStatus
    FROM swap_requests WHERE id = ?
  `, [swapId], (err, swap) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!swap) {
            return res.status(404).json({ error: 'Swap request not found' });
        }

        // Only the recipient can accept/reject, sender can cancel
        if (status === 'accepted' || status === 'rejected') {
            if ((swap as any).toUserId !== req.user?.id) {
                return res.status(403).json({ error: 'Only the recipient can accept or reject swap requests' });
            }
        } else if (status === 'cancelled') {
            if ((swap as any).fromUserId !== req.user?.id) {
                return res.status(403).json({ error: 'Only the sender can cancel swap requests' });
            }
        }

        if ((swap as any).currentStatus !== 'pending') {
            return res.status(400).json({ error: 'Can only update pending swap requests' });
        }

        db.run(`
      UPDATE swap_requests 
      SET status = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [status, swapId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update swap request' });
            }

            // WebSocket notifications temporarily disabled
            // const wsService = getWebSocketService();
            // const notification = {
            //     type: status === 'accepted' ? 'swap_accepted' as const :
            //         status === 'rejected' ? 'swap_rejected' as const :
            //             'swap_completed' as const,
            //     title: `Swap request ${status}`,
            //     message: `Your swap request has been ${status}.`,
            //     data: { swapId },
            // };

            // if (status === 'accepted' || status === 'rejected') {
            //     wsService.notifyUser((swap as any).fromUserId, notification);
            // } else if (status === 'cancelled') {
            //     wsService.notifyUser((swap as any).toUserId, notification);
            // }

            res.json({ message: `Swap request ${status} successfully` });
        });
    });
});

// Delete swap request (only if pending and user is sender)
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const swapId = parseInt(req.params.id);

    db.get(`
    SELECT fromUserId, status FROM swap_requests WHERE id = ?
  `, [swapId], (err, swap) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!swap) {
            return res.status(404).json({ error: 'Swap request not found' });
        }

        if ((swap as any).fromUserId !== req.user?.id) {
            return res.status(403).json({ error: 'Only the sender can delete swap requests' });
        }

        if ((swap as any).status !== 'pending') {
            return res.status(400).json({ error: 'Can only delete pending swap requests' });
        }

        db.run('DELETE FROM swap_requests WHERE id = ?', [swapId], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete swap request' });
            }

            res.json({ message: 'Swap request deleted successfully' });
        });
    });
});

// Create rating for completed swap
router.post('/:id/rate', authenticateToken, [
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim().isLength({ max: 500 })
], (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const swapId = parseInt(req.params.id);
    const { rating, comment }: CreateRatingRequest = req.body;

    // Check if swap is completed and user is involved
    db.get(`
    SELECT fromUserId, toUserId, status FROM swap_requests WHERE id = ?
  `, [swapId], (err, swap) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!swap) {
            return res.status(404).json({ error: 'Swap request not found' });
        }

        if ((swap as any).status !== 'accepted') {
            return res.status(400).json({ error: 'Can only rate accepted swaps' });
        }

        if ((swap as any).fromUserId !== req.user?.id && (swap as any).toUserId !== req.user?.id) {
            return res.status(403).json({ error: 'Not authorized to rate this swap' });
        }

        // Check if user already rated this swap
        const toUserId = (swap as any).fromUserId === req.user?.id ? (swap as any).toUserId : (swap as any).fromUserId;

        db.get(`
      SELECT id FROM ratings WHERE swapId = ? AND fromUserId = ?
    `, [swapId, req.user?.id], (err, existingRating) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingRating) {
                return res.status(400).json({ error: 'You have already rated this swap' });
            }

            // Create rating
            db.run(`
        INSERT INTO ratings (swapId, fromUserId, toUserId, rating, comment)
        VALUES (?, ?, ?, ?, ?)
      `, [swapId, req.user?.id, toUserId, rating, comment], function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create rating' });
                }

                res.status(201).json({
                    message: 'Rating created successfully',
                    ratingId: this.lastID
                });
            });
        });
    });
});

export { router as swapRoutes }; 