const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
        // Stored as a bcrypt hash — never plain text
    },
    purpose: {
        type: String,
        enum: ['register', 'login'],
        required: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // MongoDB TTL index — auto-deletes expired documents
    }
}, {
    timestamps: true
});

// Compound index for efficient lookups
otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('Otp', otpSchema);
