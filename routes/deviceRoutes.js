const express = require('express');
const { body, param } = require('express-validator');
const deviceController = require('../controllers/deviceController');
const { authenticateDevice } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Device management endpoints
 */

/**
 * @swagger
 * /api/devices/register:
 *   post:
 *     summary: Register or update a device
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Unique device identifier
 *               name:
 *                 type: string
 *                 description: Device name
 *               model:
 *                 type: string
 *                 description: Device model
 *               manufacturer:
 *                 type: string
 *                 description: Device manufacturer
 *               androidVersion:
 *                 type: string
 *                 description: Android version
 *               fcmToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *     responses:
 *       200:
 *         description: Device registered/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   description: JWT token for device authentication
 *                 device:
 *                   $ref: '#/components/schemas/Device'
 */
router.post('/register', [
    body('deviceId').isString().trim().notEmpty().withMessage('Device ID is required'),
    body('name').optional().isString().trim(),
    body('model').optional().isString().trim(),
    body('manufacturer').optional().isString().trim(),
    body('androidVersion').optional().isString().trim(),
    body('fcmToken').optional().isString().trim(),
], deviceController.registerDevice);

/**
 * @swagger
 * /api/devices/{deviceId}/nickname:
 *   put:
 *     summary: Update device nickname
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: New nickname for the device
 *     responses:
 *       200:
 *         description: Nickname updated successfully
 */
router.put('/:deviceId/nickname', [
    param('deviceId').isString().notEmpty(),
    body('nickname').isString().trim().notEmpty()
], authenticateDevice, deviceController.updateNickname);

/**
 * @swagger
 * /api/devices/{deviceId}:
 *   get:
 *     summary: Get device details
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 device:
 *                   $ref: '#/components/schemas/Device'
 */
router.get('/:deviceId', [
    param('deviceId').isString().notEmpty()
], authenticateDevice, deviceController.getDevice);

/**
 * @swagger
 * /api/devices/heartbeat:
 *   post:
 *     summary: Update device heartbeat
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Heartbeat received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.post('/heartbeat', authenticateDevice, deviceController.handleHeartbeat);

module.exports = router;
