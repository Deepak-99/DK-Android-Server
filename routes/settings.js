const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Middleware to verify JWT token
const authenticateToken = require('../middleware/auth');

// Get all settings for a user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const settings = await db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);

        if (!settings) {
            return res.status(404).json({ error: 'Settings not found' });
        }

        res.json({
            theme: settings.theme || 'light',
            notifications: JSON.parse(settings.notifications || '{}'),
            security: JSON.parse(settings.security || '{}'),
            updatedAt: settings.updated_at
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update settings
router.put(
    '/',
    authenticateToken,
    [
        body('theme').optional().isIn(['light', 'dark', 'system']),
        body('notifications').optional().isObject(),
        body('security').optional().isObject()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { userId } = req.user;
            const { theme, notifications, security } = req.body;

            // Check if settings exist
            const existing = await db.get(
                'SELECT id FROM user_settings WHERE user_id = ?',
                [userId]
            );

            if (existing) {
                // Update existing settings
                await db.run(
                    `UPDATE user_settings 
           SET theme = COALESCE(?, theme),
               notifications = COALESCE(?, notifications),
               security = COALESCE(?, security),
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
                    [
                        theme,
                        notifications ? JSON.stringify(notifications) : null,
                        security ? JSON.stringify(security) : null,
                        userId
                    ]
                );
            } else {
                // Create new settings
                await db.run(
                    `INSERT INTO user_settings 
           (id, user_id, theme, notifications, security)
           VALUES (?, ?, ?, ?, ?)`,
                    [
                        uuidv4(),
                        userId,
                        theme || 'light',
                        notifications ? JSON.stringify(notifications) : '{}',
                        security ? JSON.stringify(security) : '{}'
                    ]
                );
            }

            res.json({
                success: true,
                message: 'Settings updated successfully'
            });
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    }
);

// Get notification preferences
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const settings = await db.get(
            'SELECT notifications FROM user_settings WHERE user_id = ?',
            [userId]
        );

        res.json(JSON.parse(settings?.notifications || '{}'));
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ error: 'Failed to fetch notification settings' });
    }
});

// Update notification preferences
router.put(
    '/notifications',
    authenticateToken,
    [
        body().isObject().withMessage('Invalid notification settings')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { userId } = req.user;
            const notifications = req.body;

            await db.run(
                `INSERT OR REPLACE INTO user_settings 
         (id, user_id, notifications, updated_at)
         VALUES (
           COALESCE((SELECT id FROM user_settings WHERE user_id = ?), ?),
           ?, 
           ?, 
           CURRENT_TIMESTAMP
         )`,
                [userId, uuidv4(), userId, JSON.stringify(notifications)]
            );

            res.json({
                success: true,
                message: 'Notification settings updated'
            });
        } catch (error) {
            console.error('Error updating notification settings:', error);
            res.status(500).json({ error: 'Failed to update notification settings' });
        }
    }
);

module.exports = router;
