const ErrorHandler = require("../utils/errorhandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong Mongodb ID error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid, try again`;
    err = new ErrorHandler(message, 400);
  }

  // JWT expired
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token has expired, try again`;
    err = new ErrorHandler(message, 400);
  }

  // Send the cleaned response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,  // ✅ This is what frontend expects!
  });
};