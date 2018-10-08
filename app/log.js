/** Supported levels of logging */
const LogLevels = {
  /** Log messages of debugging level and higher */
  DEBUG: 0,
  /** Log messages of info level and higher  */
  INFO: 1,
  /** Log messages of warning level and higher */
  WARN: 2,
  /** Log messages of error level and higher */
  ERROR: 3
};

let logLevel = LogLevels.INFO;

const date = () => (new Date()).toISOString();

module.exports.LogLevels = LogLevels;

/**
 * Logs a debug message
 * @param {any} message the debug message to log
 * @param  {...any} optionalParams optional parameters to log
 */
module.exports.debug = function debug(message, ...optionalParams) {
  if (logLevel <= LogLevels.DEBUG) {
    console.debug(`${date()} DEBUG\t`, message, ...optionalParams);
  }
};

/**
 * Logs an info message
 * @param {any} message the info message to log
 * @param  {...any} optionalParams optional parameters to log
 */
module.exports.info = function info(message, ...optionalParams) {
  if (logLevel <= LogLevels.INFO) {
    console.info(`${date()} INFO\t`, message, ...optionalParams);
  }
};

/**
 * Logs a warning message
 * @param {any} message the warning message to log
 * @param  {...any} optionalParams optional parameters to log
 */
module.exports.warn = function warn(message, ...optionalParams) {
  if (logLevel <= LogLevels.WARN) {
    console.warn(`${date()} WARN\t`, message, ...optionalParams);
  }
};

/**
 * Logs an error
 * @param {any} message the error message to log
 * @param  {...any} optionalParams optional parameters to log
 */
module.exports.error = function error(message, ...optionalParams) {
  if (logLevel <= LogLevels.ERROR) {
    console.error(`${date()} ERROR\t`, message, ...optionalParams);
  }
};

/**
 * Activates logging of messages of the given and higher levels
 * @param {Number} level the logging level to set
 * @returns {Number} the current logging level
 */
module.exports.level = function level(level) {
  if (
    typeof level === 'number' &&
    level >= LogLevels.DEBUG &&
    level <= LogLevels.ERROR
  ) {
    logLevel = level;
  }
  return logLevel;
};
