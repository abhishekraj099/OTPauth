const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { sendOtpValidator, verifyOtpValidator, refreshTokenValidator } = require('../validators/auth.validator');
const { otpLimiter, verifyLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Email OTP Authentication
 */

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       429:
 *         description: Too many requests
 */
router.post('/send-otp', otpLimiter, sendOtpValidator, authController.sendOtp);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and get tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid OTP
 */
router.post('/verify-otp', verifyLimiter, verifyOtpValidator, authController.verifyOtp);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "f4b3c7a2-0c7f-4b4c-9b6a-2b9a2a9c6e3b"
 *     responses:
 *       200:
 *         description: Token refreshed (returns new refresh token)
 */
router.post('/refresh-token', refreshTokenValidator, authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout from current device
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout-all', authenticate, authController.logoutAll);

module.exports = router;
