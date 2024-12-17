const winston = require("winston");
const path = require("path");

// Define log file paths
const logFilePath = path.join(__dirname, "..", "logs", "app.log");
const errorLogFilePath = path.join(__dirname, "..", "logs", "error.log");

// Create a logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info", // Use an environment variable or default to "info"
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} | ${level.toUpperCase()} | ${message}`;
    })
  ),
  transports: [
    // Console transport for real-time logs
    new winston.transports.Console(),

    // File transport for all logs
    new winston.transports.File({ filename: logFilePath, level: "info" }),

    // File transport for error logs
    new winston.transports.File({ filename: errorLogFilePath, level: "error" }),
  ],
});

// If the environment is development, log to the console
if (process.env.NODE_ENV === "development") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;
