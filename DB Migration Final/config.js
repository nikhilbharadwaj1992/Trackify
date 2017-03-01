/**
 * Initializing Config Object.
 */
var config = {};
/**
 * Define Connection String to MongoDB
 */
config.appHostName = "http://localhost:9000";
config.connectionString = 'mongodb://localhost:27017/trackify_db';

/**
 * Export Config Object
 */
 module.exports = config;