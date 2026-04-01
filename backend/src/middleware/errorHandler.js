/**
 * Centralized error-handling middleware.
 *
 * Any route / controller can call  next(err)  or  throw  to land here.
 * Errors with a .statusCode property get that HTTP status;
 * everything else defaults to 500.
 */
export const errorHandler = (err, req, res, _next) => {
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the full error in development
    if (process.env.NODE_ENV !== "production") {
        console.error(`[ERROR] ${status} — ${message}`);
        if (err.stack) console.error(err.stack);
    }

    res.status(status).json({
        error: message,
        ...(err.details && { details: err.details }),
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
};

/**
 * Helper: Create an error with an HTTP status code.
 *
 * Usage:
 *   throw createError(404, "Form not found");
 */
export const createError = (statusCode, message) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
};
