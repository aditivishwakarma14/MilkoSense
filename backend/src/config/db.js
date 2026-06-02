const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/milkosense';
    const retryInterval = 5000; // Retry connection every 5 seconds if it fails

    console.log(`[Database] Attempting to connect to MongoDB...`);

    const attemptConnection = async () => {
        try {
            await mongoose.connect(mongoURI);
            console.log('==================================================');
            console.log('   MongoDB Database Connected Successfully');
            console.log('==================================================');
        } catch (error) {
            console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
            console.log(`[Database] Retrying in ${retryInterval / 1000} seconds...`);
            setTimeout(attemptConnection, retryInterval);
        }
    };

    // Connection event listeners for production visibility
    mongoose.connection.on('disconnected', () => {
        console.warn('[Database Alert] Mongoose connection disconnected!');
    });

    mongoose.connection.on('error', (err) => {
        console.error(`[Database Alert] Mongoose connection error: ${err.message}`);
    });

    await attemptConnection();
};

module.exports = connectDB;
