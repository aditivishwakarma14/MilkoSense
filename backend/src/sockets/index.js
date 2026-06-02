let ioInstance = null;

const initSockets = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });

    console.log('[Socket.IO] Handlers and listeners initialized successfully');
};

// Centralized broadcast helper for real-time telemetry updates
const broadcastSensorUpdate = (sensorData) => {
    if (ioInstance) {
        ioInstance.emit('sensorData', sensorData);
    } else {
        console.warn('[Socket.IO Warning] Attempted to broadcast sensorData, but Socket.IO is not initialized.');
    }
};

// Centralized broadcast helper for critical milk quality alarms
const broadcastAlert = (alertPayload) => {
    if (ioInstance) {
        ioInstance.emit('alert', alertPayload);
        console.log('[Socket.IO Alert] Sub-standard quality alert broadcasted:', alertPayload);
    } else {
        console.warn('[Socket.IO Warning] Attempted to broadcast alert, but Socket.IO is not initialized.');
    }
};

module.exports = {
    initSockets,
    broadcastSensorUpdate,
    broadcastAlert
};
