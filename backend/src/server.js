const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ── SEC-03 FIX: Warn loudly on missing critical env vars at startup ─────────────
(function checkEnv() {
    const warnings = [];
    if (!process.env.MONGODB_URI)     warnings.push('  ⚠️  MONGODB_URI      is not set — database writes will fail');
    if (!process.env.ML_SERVICE_URL)  warnings.push('  ⚠️  ML_SERVICE_URL   is not set — JS fallback will be used instead of Python ML');
    if (!process.env.PYTHON_ML_API_KEY) warnings.push('  ⚠️  PYTHON_ML_API_KEY is not set — using insecure hardcoded default key');
    if (warnings.length > 0) {
        console.warn('\n╭── MilkoSense Environment Warnings ────────────────────────────────╮');
        warnings.forEach(w => console.warn(w));
        console.warn('╰── Set these in your .env file for full functionality ───────────╯\n');
    }
})();

// Mongoose & Sockets Initialization
const connectDB = require('./config/db');
const socketHandler = require('./sockets');

// Express App Initialization
const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = socketIo(server, {
    cors: {
        origin: '*', // Allows access from any dev environment
        methods: ['GET', 'POST']
    }
});

// Port Configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database Container
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register Custom HTTP Request Logging Middleware
const logger = require('./middleware/logger');
app.use(logger);

// Initialize modular WebSocket listener triggers
socketHandler.initSockets(io);

// REST API Route Registration
app.use('/api/sensors', require('./routes/sensorsRoutes'));
app.use('/api/analysis', require('./routes/analysisRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));
app.use('/api/realtime', require('./routes/realtimeRoutes'));

// Authentication Routes
app.use('/auth', require('./routes/authRoutes'));

// Unified Host Server: Serve Static Frontend Folder
const frontendPublicPath = path.join(__dirname, '../../frontend/public');
const frontendRootPath = path.join(__dirname, '../../frontend');

app.use(express.static(frontendPublicPath));
app.use('/assets', express.static(path.join(frontendRootPath, 'assets')));
app.use('/services', express.static(path.join(frontendRootPath, 'services')));
app.use('/pages', express.static(path.join(frontendRootPath, 'pages')));
app.use('/components', express.static(path.join(frontendRootPath, 'components')));

// Fallback path to serve index.html for undefined web routes
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(frontendPublicPath, 'index.html'));
});

// Register Centralized Production Error-Handling Middleware (Must be last)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Start Server Listen
server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`   MilkoSense Server Successfully Initialized`);
    console.log(`   Running in : ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`   REST Port  : http://localhost:${PORT}`);
    console.log(`   Socket.IO  : Active and Listening`);
    console.log(`==================================================`);
});

// Safe cleanup on termination
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Cleaning up connections...');
    server.close(() => {
        console.log('Server gracefully terminated.');
    });
});
