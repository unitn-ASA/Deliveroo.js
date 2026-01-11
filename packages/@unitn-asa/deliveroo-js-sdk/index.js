import { IODeliveroojsServer } from './src/web-socket/IODeliveroojsServer.js'
import { IODeliveroojsClient } from './src/web-socket/IODeliveroojsClient.js'
import { parseClockEvent } from './src/web-socket/IOClockEvent.js'

/**
 * @typedef {import("./src/IOConfig.js").IOConfig} IOConfig
 * @typedef {import("./src/IOGameOptions.js").IOGameOptions} IOGameOptions
 * 
 * @typedef {import("./src/web-socket/IOClockEvent.js").IOClockEvent} IOClockEvent
 * 
 * @typedef {import("./src/web-socket/ioTypes.js").IOAgent} IOAgent
 * @typedef {import("./src/web-socket/ioTypes.js").IOParcel} IOParcel
 * @typedef {import("./src/web-socket/ioTypes.js").IOTile} IOTile
 * @typedef {import("./src/web-socket/ioTypes.js").IOSensing} IOSensing
 * @typedef {import("./src/web-socket/ioTypes.js").IOInfo} IOInfo
 *
 * @typedef {import("./src/web-socket/ioTypes.js").IOClientEvents} IOClientEvents
 * @typedef {import("./src/web-socket/ioTypes.js").IOServerEvents} IOServerEvents
 *
 * @typedef {import("./src/web-socket/IODeliveroojsClient.js").IODeliveroojsClientSocket} IODeliveroojsClientSocket
 * @typedef {import("./src/web-socket/IODeliveroojsServer.js").IODeliveroojsServerSocket} IODeliveroojsServerSocket
 */

export { IODeliveroojsClient, IODeliveroojsServer, parseClockEvent };
