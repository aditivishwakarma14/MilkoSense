/**
 * MilkoSense Email Templates
 * Professional, responsive HTML email templates with MilkoSense branding.
 */

// ─── Shared Styles ───────────────────────────────────────────────────────────

const brandColor = '#0ea5e9';
const brandGradient = 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)';
const darkBg = '#0f172a';
const cardBg = '#1e293b';
const textLight = '#e2e8f0';
const textMuted = '#94a3b8';
const borderColor = '#334155';

const baseWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MilkoSense</title>
</head>
<body style="margin:0;padding:0;background-color:${darkBg};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${darkBg};padding:40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding-bottom:32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background:${brandGradient};width:48px;height:48px;border-radius:12px;text-align:center;vertical-align:middle;">
                                        <span style="color:#fff;font-size:24px;font-weight:700;">M</span>
                                    </td>
                                    <td style="padding-left:12px;">
                                        <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">MilkoSense</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td style="background-color:${cardBg};border-radius:16px;border:1px solid ${borderColor};padding:40px 36px;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding-top:32px;">
                            <p style="color:${textMuted};font-size:12px;margin:0;line-height:1.6;">
                                This email was sent by MilkoSense — Smart AI Milk Quality Assessment<br>
                                &copy; ${new Date().getFullYear()} MilkoSense. All rights reserved.
                            </p>
                            <p style="color:${textMuted};font-size:11px;margin:8px 0 0;">
                                If you did not request this email, please ignore it.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

// ─── Registration OTP Template ───────────────────────────────────────────────

const registrationOtpTemplate = (otp, expiryMinutes = 10) => {
    const content = `
        <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;text-align:center;">
            Verify Your Email
        </h1>
        <p style="color:${textMuted};font-size:15px;margin:0 0 32px;text-align:center;line-height:1.6;">
            Welcome to MilkoSense! Use the verification code below to complete your registration.
        </p>

        <!-- OTP Code -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center">
                    <div style="background:${darkBg};border:2px solid ${brandColor};border-radius:12px;padding:24px 40px;display:inline-block;">
                        <span style="color:#fff;font-size:36px;font-weight:800;letter-spacing:12px;font-family:'Courier New',monospace;">
                            ${otp}
                        </span>
                    </div>
                </td>
            </tr>
        </table>

        <p style="color:${textMuted};font-size:13px;margin:24px 0 0;text-align:center;line-height:1.6;">
            ⏱️ This code expires in <strong style="color:${brandColor};">${expiryMinutes} minutes</strong>.
        </p>

        <!-- Security Notice -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
            <tr>
                <td style="background:rgba(14,165,233,0.08);border-radius:8px;padding:16px;border-left:3px solid ${brandColor};">
                    <p style="color:${textMuted};font-size:12px;margin:0;line-height:1.5;">
                        🔒 <strong style="color:${textLight};">Security Notice:</strong> Never share this code with anyone. MilkoSense will never ask for your OTP via phone or message.
                    </p>
                </td>
            </tr>
        </table>
    `;
    return baseWrapper(content);
};

// ─── Registration Success Template ───────────────────────────────────────────

const registrationSuccessTemplate = (name) => {
    const content = `
        <!-- Success Icon -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center" style="padding-bottom:24px;">
                    <div style="background:rgba(16,185,129,0.15);width:64px;height:64px;border-radius:50%;line-height:64px;text-align:center;">
                        <span style="font-size:32px;">✅</span>
                    </div>
                </td>
            </tr>
        </table>

        <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;text-align:center;">
            Welcome to MilkoSense!
        </h1>
        <p style="color:${textMuted};font-size:15px;margin:0 0 28px;text-align:center;line-height:1.6;">
            Hi <strong style="color:${textLight};">${name}</strong>, your account has been successfully created.
        </p>

        <!-- Features Grid -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td style="background:${darkBg};border-radius:12px;padding:20px;border:1px solid ${borderColor};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding:8px 0;">
                                <span style="color:${brandColor};font-size:16px;margin-right:10px;">📊</span>
                                <span style="color:${textLight};font-size:14px;">Real-time milk quality analysis</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0;">
                                <span style="color:${brandColor};font-size:16px;margin-right:10px;">🤖</span>
                                <span style="color:${textLight};font-size:14px;">AI-powered quality predictions</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0;">
                                <span style="color:${brandColor};font-size:16px;margin-right:10px;">📈</span>
                                <span style="color:${textLight};font-size:14px;">Comprehensive sensor dashboards</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0;">
                                <span style="color:${brandColor};font-size:16px;margin-right:10px;">📋</span>
                                <span style="color:${textLight};font-size:14px;">Automated report generation</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <p style="color:${textMuted};font-size:13px;margin:24px 0 0;text-align:center;line-height:1.6;">
            You can now log in and start exploring the platform.
        </p>
    `;
    return baseWrapper(content);
};

// ─── Login OTP Template ──────────────────────────────────────────────────────

const loginOtpTemplate = (otp, expiryMinutes = 10) => {
    const content = `
        <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;text-align:center;">
            Login Verification
        </h1>
        <p style="color:${textMuted};font-size:15px;margin:0 0 32px;text-align:center;line-height:1.6;">
            A login attempt was detected on your MilkoSense account. Enter the code below to verify.
        </p>

        <!-- OTP Code -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center">
                    <div style="background:${darkBg};border:2px solid ${brandColor};border-radius:12px;padding:24px 40px;display:inline-block;">
                        <span style="color:#fff;font-size:36px;font-weight:800;letter-spacing:12px;font-family:'Courier New',monospace;">
                            ${otp}
                        </span>
                    </div>
                </td>
            </tr>
        </table>

        <p style="color:${textMuted};font-size:13px;margin:24px 0 0;text-align:center;line-height:1.6;">
            ⏱️ This code expires in <strong style="color:${brandColor};">${expiryMinutes} minutes</strong>.
        </p>

        <!-- Security Notice -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
            <tr>
                <td style="background:rgba(245,158,11,0.08);border-radius:8px;padding:16px;border-left:3px solid #f59e0b;">
                    <p style="color:${textMuted};font-size:12px;margin:0;line-height:1.5;">
                        ⚠️ <strong style="color:#fbbf24;">Didn't request this?</strong> If you didn't attempt to log in, someone may be trying to access your account. Please secure your password immediately.
                    </p>
                </td>
            </tr>
        </table>
    `;
    return baseWrapper(content);
};

// ─── Login Success Notification Template ─────────────────────────────────────

const loginSuccessTemplate = (email, loginTime) => {
    const formattedTime = new Date(loginTime).toLocaleString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Kolkata'
    });

    const content = `
        <!-- Lock Icon -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center" style="padding-bottom:24px;">
                    <div style="background:rgba(14,165,233,0.15);width:64px;height:64px;border-radius:50%;line-height:64px;text-align:center;">
                        <span style="font-size:32px;">🔐</span>
                    </div>
                </td>
            </tr>
        </table>

        <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;text-align:center;">
            Login Successful
        </h1>
        <p style="color:${textMuted};font-size:15px;margin:0 0 28px;text-align:center;line-height:1.6;">
            A new login was detected on your MilkoSense account.
        </p>

        <!-- Login Details -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td style="background:${darkBg};border-radius:12px;padding:20px;border:1px solid ${borderColor};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding:10px 0;border-bottom:1px solid ${borderColor};">
                                <span style="color:${textMuted};font-size:13px;">Account</span><br>
                                <span style="color:${textLight};font-size:15px;font-weight:600;">${email}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:10px 0;">
                                <span style="color:${textMuted};font-size:13px;">Login Time</span><br>
                                <span style="color:${textLight};font-size:15px;font-weight:600;">${formattedTime}</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Security Warning -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
                <td style="background:rgba(239,68,68,0.08);border-radius:8px;padding:16px;border-left:3px solid #ef4444;">
                    <p style="color:${textMuted};font-size:12px;margin:0;line-height:1.5;">
                        🚨 <strong style="color:#fca5a5;">Not you?</strong> If you did not perform this login, please change your password immediately and contact support. Your account security may be compromised.
                    </p>
                </td>
            </tr>
        </table>
    `;
    return baseWrapper(content);
};

module.exports = {
    registrationOtpTemplate,
    registrationSuccessTemplate,
    loginOtpTemplate,
    loginSuccessTemplate
};
