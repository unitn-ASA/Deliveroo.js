
/**
 * @typedef {Object} IOMetrics
 * @property { {ms: number, frame: number, fps: number, uptime: number} } timing
 * @property { {heapUsed: number, heapTotal: number, rss: number, external: number} } memory
 * @property { {current: number} } cpu
 * @property { {currentLag: number, maxLag: number, avgLag: number} } eventLoop
 * @property { {avg: number, min: number, max: number, byAgent: Object.<string, {
 *      id: string,
 *      name: string,
 *      teamId: string,
 *      teamName: string,
 *      sockets: ( { socketId: string, frame: number, avg: number, min: number, max: number } ) []
 *  }> } } latency
 */

export { };
