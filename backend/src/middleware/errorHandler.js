const errorHandler = (err, req, res, next) => {
    console.error(`[Error Handler] Intercepted Exception:`, err);

    const statusCode = err.statusCode || 500;
    const responsePayload = {
        success: false,
        error: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
    };

    // Include stacks in development mode only
    if (process.env.NODE_ENV === 'development') {
        responsePayload.stack = err.stack;
    }

    return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
