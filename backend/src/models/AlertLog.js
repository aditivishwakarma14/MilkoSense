const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    adulteration: {
        type: Boolean,
        default: false
    },
    resolved: {
        type: Boolean,
        default: false,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AlertLog', alertLogSchema);
