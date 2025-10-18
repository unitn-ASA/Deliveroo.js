// Import socket types
import { default as IOClient } from './src/IOClient.js';
import { default as IOServer } from './src/IOServer.js';

/**
 * @typedef {import("./src/ioTypes.js").IOAgent} IOAgent
 * @typedef {import("./src/ioTypes.js").IOParcel} IOParcel
 * @typedef {import("./src/ioTypes.js").IOTile} IOTile
 * @typedef {import("./src/ioTypes.js").IOInfo} IOInfo
 * 
 * @typedef {import("./src/ioTypes.js").IOClientEvents} IOClientEvents
 * @typedef {import("./src/ioTypes.js").IOServerEvents} IOServerEvents
 * 
 * @typedef {import("./src/IOClient.js").ClientSocket} IOClientSocket
 * @typedef {import("./src/IOServer.js").ServerSocket} IOServerSocket
 */

export { IOClient, IOServer };
