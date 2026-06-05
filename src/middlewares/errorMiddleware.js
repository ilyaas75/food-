export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'Image too large (max 5MB)';
    } else if (err.message?.includes('Only image files')) {
        statusCode = 400;
    }

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
