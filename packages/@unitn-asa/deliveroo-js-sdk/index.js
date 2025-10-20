import { IODeliveroojsServer } from './src/web-socket/IODeliveroojsServer.js'
import { IODeliveroojsClient } from './src/web-socket/IODeliveroojsClient.js'

/**
 * @typedef {import("./src/web-socket/ioTypes.js").IOAgent} IOAgent
 * @typedef {import("./src/web-socket/ioTypes.js").IOParcel} IOParcel
 * @typedef {import("./src/web-socket/ioTypes.js").IOTile} IOTile
 * @typedef {import("./src/web-socket/ioTypes.js").IOInfo} IOInfo
 * 
 * @typedef {import("./src/web-socket/ioTypes.js").IOClientEvents} IOClientEvents
 * @typedef {import("./src/web-socket/ioTypes.js").IOServerEvents} IOServerEvents
 * 
 * @typedef {import("./src/web-socket/IODeliveroojsClient.js").IODeliveroojsClientSocket} IODeliveroojsClientSocket
 * @typedef {import("./src/web-socket/IODeliveroojsServer.js").IODeliveroojsServerSocket} IODeliveroojsServerSocket
 */

export { IODeliveroojsClient, IODeliveroojsServer };
