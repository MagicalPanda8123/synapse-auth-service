// centralized error handler middleware
export function errorHandler(err, req, res, next) {
  console.log(err) // will replace with logger (pino)

  // set default values
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    message,
    // only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
