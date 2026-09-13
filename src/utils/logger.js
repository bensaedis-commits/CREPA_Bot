const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[${getTimestamp()}] [INFO]`, ...args),
  success: (...args) => console.log(`[${getTimestamp()}] [SUCCESS]`, ...args),
  warn: (...args) => console.warn(`[${getTimestamp()}] [WARN]`, ...args),
  error: (...args) => console.error(`[${getTimestamp()}] [ERROR]`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${getTimestamp()}] [DEBUG]`, ...args);
    }
  },
};

module.exports = logger;
