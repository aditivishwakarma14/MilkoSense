const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * MilkoSense Email Service
 * Centralized Nodemailer transporter using Gmail SMTP with App Passwords.
 */

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter connection on startup
transporter.verify()
    .then(() => {
        console.log('[Email Service] ✅ Gmail SMTP transporter is ready to send emails');
    })
    .catch((error) => {
        console.error('[Email Service] ❌ Failed to connect to Gmail SMTP:', error.message);
    });

/**
 * Send an email using the configured transporter.
 * @param {Object} options - { to, subject, html }
 * @returns {Promise<Object>} Nodemailer send info
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: `"MilkoSense" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] ✉️  Email sent to ${to} | MessageId: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[Email Service] ❌ Failed to send email to ${to}:`, error.message);
        throw new Error('Failed to send email. Please try again later.');
    }
};

module.exports = { sendEmail };
