const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    register,
    verifyRegisterOtp,
    login,
    verifyLoginOtp
} = require('../controllers/authController');

const router = express.Router();

/**
 * MilkoSense Auth Routes
 * All routes are prefixed with /auth (registered in server.js)
 */

// ─── Rate Limiters ───────────────────────────────────────────────────────────

// General auth rate limiter — 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict OTP rate limiter — 5 requests per 15 minutes per IP
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// Registration flow
router.post('/register', otpLimiter, register);
router.post('/verify-register-otp', authLimiter, verifyRegisterOtp);

// Login flow
router.post('/login', otpLimiter, login);
router.post('/verify-login-otp', authLimiter, verifyLoginOtp);

module.exports = router;
