const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');

/**
 * MilkoSense OTP Service
 * Handles generation, hashing, storage, and verification of OTPs.
 */

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_REQUESTS = 5;           // Max OTP requests per window
const OTP_RATE_WINDOW_MINUTES = 15;   // Rate-limit window

/**
 * Generate a cryptographically secure 6-digit OTP.
 */
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Create and store a hashed OTP for a given email and purpose.
 * Invalidates all previous OTPs for the same email + purpose combo.
 * @param {string} email
 * @param {string} purpose - 'register' | 'login'
 * @returns {string} The plain-text OTP (to send via email)
 */
const createOTP = async (email, purpose) => {
    // Invalidate all previous OTPs for this email + purpose
    await Otp.deleteMany({ email, purpose });

    const plainOtp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(plainOtp, salt);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({
        email,
        otp: hashedOtp,
        purpose,
        expiresAt
    });

    console.log(`[OTP Service] 🔑 OTP created for ${email} (purpose: ${purpose}), expires at ${expiresAt.toISOString()}`);
    console.log(`[DEVELOPMENT / TESTING ONLY] 🏷️  PLAIN OTP CODE: ${plainOtp}`);
    return plainOtp;
};

/**
 * Verify a plain-text OTP against stored hashed OTPs.
 * Marks the OTP as used upon successful verification.
 * @param {string} email
 * @param {string} plainOtp
 * @param {string} purpose - 'register' | 'login'
 * @returns {boolean} true if OTP is valid
 */
const verifyOTP = async (email, plainOtp, purpose) => {
    const otpRecord = await Otp.findOne({
        email,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }); // Get the most recent OTP

    if (!otpRecord) {
        console.warn(`[OTP Service] ⚠️  No valid OTP found for ${email} (purpose: ${purpose})`);
        return false;
    }

    const isMatch = await bcrypt.compare(plainOtp, otpRecord.otp);

    if (isMatch) {
        // Mark OTP as used to prevent reuse
        otpRecord.isUsed = true;
        await otpRecord.save();
        console.log(`[OTP Service] ✅ OTP verified for ${email} (purpose: ${purpose})`);

        // Cleanup: remove all OTPs for this email + purpose
        await Otp.deleteMany({ email, purpose });
        return true;
    }

    console.warn(`[OTP Service] ❌ OTP mismatch for ${email} (purpose: ${purpose})`);
    return false;
};

/**
 * Check if user has exceeded OTP request rate limit.
 * @param {Object} user - Mongoose user document
 * @returns {boolean} true if rate-limited
 */
const isRateLimited = (user) => {
    if (!user.otpRequestWindowStart) return false;

    const windowStart = new Date(user.otpRequestWindowStart);
    const windowEnd = new Date(windowStart.getTime() + OTP_RATE_WINDOW_MINUTES * 60 * 1000);
    const now = new Date();

    // If we're still within the rate window
    if (now < windowEnd) {
        return user.otpRequestCount >= MAX_OTP_REQUESTS;
    }

    // Window has expired — not rate limited
    return false;
};

/**
 * Increment OTP request counter and reset window if expired.
 * @param {Object} user - Mongoose user document
 */
const incrementOtpCounter = async (user) => {
    const now = new Date();

    if (!user.otpRequestWindowStart ||
        now > new Date(user.otpRequestWindowStart.getTime() + OTP_RATE_WINDOW_MINUTES * 60 * 1000)) {
        // Reset window
        user.otpRequestWindowStart = now;
        user.otpRequestCount = 1;
    } else {
        user.otpRequestCount += 1;
    }

    await user.save();
};

module.exports = {
    generateOTP,
    createOTP,
    verifyOTP,
    isRateLimited,
    incrementOtpCounter,
    OTP_EXPIRY_MINUTES,
    MAX_OTP_REQUESTS,
    OTP_RATE_WINDOW_MINUTES
};
