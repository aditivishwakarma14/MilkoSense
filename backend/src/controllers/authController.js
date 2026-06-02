const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createOTP, verifyOTP, isRateLimited, incrementOtpCounter, OTP_EXPIRY_MINUTES } = require('../services/otpService');
const { sendEmail } = require('../services/emailService');
const {
    registrationOtpTemplate,
    registrationSuccessTemplate,
    loginOtpTemplate,
    loginSuccessTemplate
} = require('../templates/emailTemplates');

/**
 * MilkoSense Auth Controller
 * Handles registration, login, and OTP verification flows.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// ─── POST /auth/register ────────────────────────────────────────────────────
// Step 1: Accept name, email, password → send registration OTP

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters.'
            });
        }

        // Check if user already exists and is verified
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        // If a user exists but is not verified, remove the old record so they can re-register
        if (existingUser && !existingUser.isVerified) {
            await User.deleteOne({ email });
        }

        // Create unverified user
        const user = await User.create({
            name,
            email,
            password,
            isVerified: false
        });

        // Generate and send OTP
        const otp = await createOTP(email, 'register');
        await sendEmail({
            to: email,
            subject: 'MilkoSense - Verify Your Email',
            html: registrationOtpTemplate(otp, OTP_EXPIRY_MINUTES)
        });

        console.log(`[Auth] 📝 Registration OTP sent to ${email}`);

        return res.status(200).json({
            success: true,
            message: `Verification code sent to ${email}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
            data: { email }
        });

    } catch (error) {
        console.error('[Auth] Registration error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ─── POST /auth/verify-register-otp ─────────────────────────────────────────
// Step 2: Verify OTP → mark user as verified → send welcome email

const verifyRegisterOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required.'
            });
        }

        // Verify OTP
        const isValid = await verifyOTP(email, otp, 'register');
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        // Mark user as verified
        const user = await User.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please register again.'
            });
        }

        // Generate JWT
        const token = generateToken(user._id);

        // Send welcome email (async — don't block response)
        sendEmail({
            to: email,
            subject: 'Welcome to MilkoSense',
            html: registrationSuccessTemplate(user.name)
        }).catch(err => console.error('[Auth] Failed to send welcome email:', err.message));

        console.log(`[Auth] ✅ User ${email} verified and registered successfully`);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully! Welcome to MilkoSense.',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        console.error('[Auth] Verify register OTP error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Verification failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ─── POST /auth/login ───────────────────────────────────────────────────────
// Step 1: Validate email + password → send login OTP

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // Find user with password field included
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Email not verified. Please register and verify your email first.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Rate-limit check
        if (isRateLimited(user)) {
            return res.status(429).json({
                success: false,
                message: 'Too many OTP requests. Please try again later.'
            });
        }

        // Increment OTP counter
        await incrementOtpCounter(user);

        // Generate and send login OTP
        const otp = await createOTP(email, 'login');
        await sendEmail({
            to: email,
            subject: 'MilkoSense Login Verification Code',
            html: loginOtpTemplate(otp, OTP_EXPIRY_MINUTES)
        });

        console.log(`[Auth] 🔑 Login OTP sent to ${email}`);

        return res.status(200).json({
            success: true,
            message: `Login verification code sent to ${email}.`,
            data: { email }
        });

    } catch (error) {
        console.error('[Auth] Login error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ─── POST /auth/verify-login-otp ────────────────────────────────────────────
// Step 2: Verify login OTP → issue JWT → send login notification

const verifyLoginOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required.'
            });
        }

        // Verify OTP
        const isValid = await verifyOTP(email, otp, 'login');
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new one.'
            });
        }

        // Update last login timestamp
        const loginTime = new Date();
        const user = await User.findOneAndUpdate(
            { email },
            { lastLoginAt: loginTime },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Generate JWT
        const token = generateToken(user._id);

        // Send login notification email (async — don't block response)
        sendEmail({
            to: email,
            subject: 'MilkoSense - New Login Detected',
            html: loginSuccessTemplate(email, loginTime)
        }).catch(err => console.error('[Auth] Failed to send login notification:', err.message));

        console.log(`[Auth] ✅ User ${email} logged in successfully`);

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        console.error('[Auth] Verify login OTP error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Login verification failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    register,
    verifyRegisterOtp,
    login,
    verifyLoginOtp
};
