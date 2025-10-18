// Import socket types
const IOClient = require('./src/IOClient.js');
const IOServer = require('./src/IOServer.js');

/**
 * @typedef {import("./src/ioTypes.js").IOAgent} IOAgent
 * @typedef {import("./src/ioTypes.js").IOParcel} IOParcel
 * @typedef {import("./src/ioTypes.js").IOTile} IOTile
 * @typedef {import("./src/ioTypes.js").IOInfo} IOInfo
 * 
 * @typedef {import("./src/ioTypes.js").IOClientEvents} IOClientEvents
 * @typedef {import("./src/ioTypes.js").IOServerEvents} IOServerEvents
 * 
 * @typedef {import("./src/IOClient.js").ClientSocket} IOTypedSocketClientSocket
 * @typedef {import("./src/IOServer.js").ServerSocket} IOTypedSocketServerSocket
 */

module.exports = { IOClient, IOServer };