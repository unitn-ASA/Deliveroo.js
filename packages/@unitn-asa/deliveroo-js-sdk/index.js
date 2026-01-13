import { DeliveroojsSocketServerWrapper } from './src/web-socket/DeliveroojsSocketServerWrapper.js'
import { DeliveroojsSocketClientWrapper } from './src/web-socket/DeliveroojsSocketClientWrapper.js'
import { parseClockEvent } from './src/types/IOClockEvent.js'
import { DeliveroojsRestClient } from './src/web-service/DeliveroojsRestClient.js'

/**
 * @typedef {import("./src/types/IOConfig.js").IOConfig} IOConfig
 * @typedef {import("./src/types/IOGameOptions.js").IOGameOptions} IOGameOptions
 * 
 * @typedef {import("./src/types/IOClockEvent.js").IOClockEvent} IOClockEvent
 * 
 * @typedef {import("./src/types/IOAgent.js").IOAgent} IOAgent
 * @typedef {import("./src/types/IOParcel.js").IOParcel} IOParcel
 * @typedef {import("./src/types/IOTile.js").IOTile} IOTile
 *
 * @typedef {import("./src/web-socket/types/DeliveroojsSocketIOEvents.js").IOClientEvents} IOClientEvents
 * @typedef {import("./src/web-socket/types/DeliveroojsSocketIOEvents.js").IOServerEvents} IOServerEvents
 *
 */

export { DeliveroojsSocketClientWrapper, DeliveroojsSocketServerWrapper, parseClockEvent, DeliveroojsRestClient };