import { performance } from 'perf_hooks';
import EventEmitter from 'events';

/**
 * @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOInfo.js').IOInfo} IOInfo
 */
/**
 * @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOSocketEvents.js').IOMetrics} IOMetrics
 */
/**
 * @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOSocketEvents.js').IOLatency} IOLatency
 */

/**
 * @typedef {{id: string, name: string, teamId: string, teamName: string}} AgentInfo
 */

/**
 * Performance monitoring system that tracks CPU, memory, event loop lag, and latency
 * @class PerformanceMonitor
 */
class PerformanceMonitor {

    /** @type {number} Base clock interval in ms */
    #base = 40; // 40ms = 25fps

    /** @type {number} Current milliseconds */
    #ms = 0;

    /** @type {number} Current frame */
    #frame = 0;

    /** @type {number} Start time for fps calculation */
    #startTime = 0;

    // Performance monitoring
    #lastCpuUsage = process.cpuUsage();
    #cpuSamples = [];
    #maxCpuSamples = 50;

    // Event loop lag monitoring
    #lastEventLoopTime = null;
    #eventLoopLagSamples = [];
    #maxLagSamples = 100;

    // Ping/Pong latency tracking - per socket
    /** @type {Map<string, IOLatency[]>} */
    #latencySamplesBySocket = new Map();
    #maxLatencySamplesPerSocket = 50;

    // Timing samples for FPS
    #samples = [];
    #maxSamples = 100;

    /** @type {EventEmitter} */
    #emitter = new EventEmitter();

    /**
     * @type {IOInfo & {cpuUsage: number, eventLoopLag: number, avgLatency: number, minLatency: number, maxLatency: number}}
     */
    info = {
        ms: 0,
        frame: 0,
        fps: 0,
        heapUsed: 0,
        heapTotal: 0,
        cpuUsage: 0,
        eventLoopLag: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0
    };

    constructor() {
        this.#emitter.setMaxListeners(20000);
    }

    /**
     * Set the base clock interval
     * @param {number} base - Base interval in milliseconds
     */
    setBase(base) {
        this.#base = base;
    }

    /**
     * Update current time and frame
     * @param {number} ms - Current milliseconds
     * @param {number} frame - Current frame number
     */
    updateTime(ms, frame) {
        this.#ms = ms;
        this.#frame = frame;
    }

    /**
     * Set start time for fps calculation
     * @param {number} startTime - Start timestamp
     */
    setStartTime(startTime) {
        this.#startTime = startTime;
        this.#lastEventLoopTime = process.hrtime.bigint();
    }

    /**
     * Sample performance metrics (call on each frame)
     */
    sample() {
        this.#samples.push({
            frame: this.#frame,
            time: Date.now(),
            hrtime: process.hrtime.bigint()
        });

        // Update info with all metrics
        const memoryUsage = process.memoryUsage();
        const cpuUsage = this.#computeCpuUsage();

        this.info = {
            ms: this.#ms,
            frame: this.#frame,
            fps: this.#computeFps(),
            heapUsed: Math.round(memoryUsage.heapUsed / 1000000),
            heapTotal: Math.round(memoryUsage.heapTotal / 1000000),
            cpuUsage: cpuUsage,
            eventLoopLag: this.#getEventLoopLag(),
            avgLatency: this.#getAverageLatency(),
            minLatency: this.#getMinLatency(),
            maxLatency: this.#getMaxLatency()
        };

        // Remove old samples to prevent unbounded memory growth
        if (this.#samples.length > this.#maxSamples) {
            this.#samples.shift();
        }

        // Monitor event loop lag
        this.#monitorEventLoopLag();
    }

    /**
     * Compute FPS
     * @param {number} back - Number of samples to look back
     * @returns {number} FPS
     */
    #computeFps(back = 10) {
        if (this.#samples.length < 1)
            return Math.round(this.#frame / (Date.now() - this.#startTime) * 1000 * 10) / 10;
        let lastI = this.#samples.length - 1;
        let firstI = lastI - back < 0 ? 0 : lastI - back;
        const last = this.#samples[lastI];
        const first = this.#samples[firstI];
        return Math.round((last.frame - first.frame) / (last.time - first.time) * 1000 * 10) / 10;
    }

    /**
     * Calculate CPU usage percentage since last sample
     * @returns {number} CPU usage percentage (0-100)
     */
    #computeCpuUsage() {
        const currentUsage = process.cpuUsage();
        const elapsedUsage = currentUsage.user - this.#lastCpuUsage.user;

        // Calculate CPU percentage
        const cpuPercent = Math.min(100, (elapsedUsage / (this.#base * 1000)) * 100);

        this.#lastCpuUsage = currentUsage;

        // Store sample for averaging
        this.#cpuSamples.push(cpuPercent);
        if (this.#cpuSamples.length > this.#maxCpuSamples) {
            this.#cpuSamples.shift();
        }

        // Return average CPU usage
        if (this.#cpuSamples.length === 0) return 0;
        const avgCpu = this.#cpuSamples.reduce((a, b) => a + b, 0) / this.#cpuSamples.length;
        return Math.round(avgCpu);
    }

    /**
     * Monitor event loop lag using setImmediate timing
     */
    #monitorEventLoopLag() {
        const now = process.hrtime.bigint();
        const lag = Number(now - this.#lastEventLoopTime) / 1000000; // Convert to ms

        this.#eventLoopLagSamples.push(lag);
        if (this.#eventLoopLagSamples.length > this.#maxLagSamples) {
            this.#eventLoopLagSamples.shift();
        }

        this.#lastEventLoopTime = now;
    }

    /**
     * Get current event loop lag in milliseconds
     * @returns {number} Lag in milliseconds
     */
    #getEventLoopLag() {
        if (this.#eventLoopLagSamples.length === 0) return 0;

        // Return average lag for smoother reporting
        const avg = this.#eventLoopLagSamples.reduce((a, b) => a + b, 0) / this.#eventLoopLagSamples.length;
        return Math.round(avg);
    }

    /**
     * Handle pong response and calculate latency (call from server)
     * @param {string} socketId - Unique socket identifier
     * @param {{timestamp: number}} pingData - Original ping data with timestamp
     * @param {{clientTimestamp: number}} pongData - Pong response data
     * @param {AgentInfo} agentInfo - Agent information associated with this socket
     * @returns {IOLatency | null} Latency information or null if ping not found
     */
    handlePong(socketId, pingData, pongData, agentInfo) {
        // Calculate latencies using performance.now() for high precision
        const roundTrip = performance.now() - pingData.timestamp;
        const clientProcessing = pongData.clientTimestamp - pingData.timestamp;
        const serverProcessing = performance.now() - pongData.clientTimestamp;
        const networkLag = roundTrip - clientProcessing - serverProcessing;

        // Store latency sample with socketId and agent info
        /** @type {IOLatency & {socketId: string, agentInfo: AgentInfo}} */
        const latencyData = {
            socketId: socketId,
            roundTrip: Math.round(roundTrip),
            clientProcessing: Math.round(clientProcessing),
            serverProcessing: Math.round(serverProcessing),
            networkLag: Math.round(networkLag),
            timestamp: pingData.timestamp,
            agentInfo: agentInfo
        };

        // Get or create array for this socket
        if (!this.#latencySamplesBySocket.has(socketId)) {
            this.#latencySamplesBySocket.set(socketId, []);
        }

        const socketSamples = this.#latencySamplesBySocket.get(socketId);
        socketSamples.push(latencyData);

        // Keep only recent samples per socket
        if (socketSamples.length > this.#maxLatencySamplesPerSocket) {
            socketSamples.shift();
        }

        return latencyData;
    }

    /**
     * Get average round-trip latency across all sockets
     * @returns {number} Average latency in milliseconds
     */
    #getAverageLatency() {
        let allSamples = this.#getAllLatencySamples();
        if (allSamples.length === 0) return 0;
        const sum = allSamples.reduce((acc, s) => acc + s.roundTrip, 0);
        return Math.round(sum / allSamples.length);
    }

    /**
     * Get minimum round-trip latency across all sockets
     * @returns {number} Minimum latency in milliseconds
     */
    #getMinLatency() {
        let allSamples = this.#getAllLatencySamples();
        if (allSamples.length === 0) return 0;
        return Math.min(...allSamples.map(s => s.roundTrip));
    }

    /**
     * Get maximum round-trip latency across all sockets
     * @returns {number} Maximum latency in milliseconds
     */
    #getMaxLatency() {
        let allSamples = this.#getAllLatencySamples();
        if (allSamples.length === 0) return 0;
        return Math.max(...allSamples.map(s => s.roundTrip));
    }

    /**
     * Get all latency samples from all sockets
     * @returns {IOLatency[]} All latency samples
     */
    #getAllLatencySamples() {
        const allSamples = [];
        for (const samples of this.#latencySamplesBySocket.values()) {
            allSamples.push(...samples);
        }
        return allSamples;
    }

    /**
     * Get latency statistics including per-socket breakdown
     * @returns {object} Latency statistics
     */
    getLatencyStats() {
        const allSamples = this.#getAllLatencySamples();

        if (allSamples.length === 0) {
            return {
                count: 0,
                avg: 0,
                min: 0,
                max: 0,
                samples: [],
                bySocket: {}
            };
        }

        const roundTrips = allSamples.map(s => s.roundTrip);
        const bySocket = {};

        // Build per-socket data
        for (const [socketId, samples] of this.#latencySamplesBySocket.entries()) {
            if (samples.length > 0) {
                const socketRoundTrips = samples.map(s => s.roundTrip);
                bySocket[socketId] = {
                    count: samples.length,
                    avg: Math.round(socketRoundTrips.reduce((a, b) => a + b, 0) / socketRoundTrips.length),
                    min: Math.min(...socketRoundTrips),
                    max: Math.max(...socketRoundTrips),
                    samples: [...samples] // Include socketId in each sample
                };
            }
        }

        return {
            count: allSamples.length,
            avg: Math.round(roundTrips.reduce((a, b) => a + b, 0) / roundTrips.length),
            min: Math.min(...roundTrips),
            max: Math.max(...roundTrips),
            samples: allSamples, // All samples with socketId included
            bySocket: bySocket
        };
    }

    /**
     * Get latency statistics grouped by agent
     * @returns {object} Agent-grouped latency statistics
     */
    getLatencyByAgent() {
        const byAgent = {};

        for (const [socketId, samples] of this.#latencySamplesBySocket.entries()) {
            if (samples.length === 0) continue;

            const latestSample = samples[samples.length - 1];
            // @ts-expect-error
            const agentInfo = latestSample.agentInfo;

            if (!agentInfo) continue;

            const agentKey = `${agentInfo.id}-${agentInfo.teamId}`;

            if (!byAgent[agentKey]) {
                byAgent[agentKey] = {
                    id: agentInfo.id,
                    name: agentInfo.name,
                    teamId: agentInfo.teamId,
                    teamName: agentInfo.teamName,
                    sockets: []
                };
            }

            // Calculate stats for this socket
            const socketRoundTrips = samples.map(s => s.roundTrip);
            byAgent[agentKey].sockets.push({
                socketId: socketId,
                count: samples.length,
                avg: Math.round(socketRoundTrips.reduce((a, b) => a + b, 0) / socketRoundTrips.length),
                min: Math.min(...socketRoundTrips),
                max: Math.max(...socketRoundTrips),
                latest: samples[samples.length - 1]
            });
        }

        return byAgent;
    }

    /**
     * Clear latency samples for a specific socket or all sockets
     * @param {string} [socketId] - Optional socket ID to clear. If not provided, clears all.
     */
    clearLatencySamples(socketId) {
        if (socketId) {
            this.#latencySamplesBySocket.delete(socketId);
        } else {
            this.#latencySamplesBySocket.clear();
        }
    }

    /**
     * Get detailed performance metrics
     * @returns {IOMetrics} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            timing: {
                ms: this.#ms,
                frame: this.#frame,
                fps: this.info.fps,
                uptime: Date.now() - this.#startTime
            },
            memory: {
                heapUsed: this.info.heapUsed,
                heapTotal: this.info.heapTotal,
                rss: Math.round(process.memoryUsage().rss / 1000000),
                external: Math.round(process.memoryUsage().external / 1000000)
            },
            cpu: {
                current: this.info.cpuUsage,
                samples: [...this.#cpuSamples]
            },
            eventLoop: {
                currentLag: this.#getEventLoopLag(),
                maxLag: Math.max(...this.#eventLoopLagSamples),
                avgLag: this.#eventLoopLagSamples.length > 0
                    ? this.#eventLoopLagSamples.reduce((a, b) => a + b, 0) / this.#eventLoopLagSamples.length
                    : 0
            },
            latency: {
                ...this.getLatencyStats(),
                byAgent: this.getLatencyByAgent()
            }
        };
    }

    /**
     * Register event listener
     * @param {string} event - Event name
     * @param {(...args: any[]) => void} cb - Callback function
     */
    on(event, cb) {
        this.#emitter.on(event, cb);
    }

    /**
     * Register one-time event listener
     * @param {string} event - Event name
     * @param {(...args: any[]) => void} cb - Callback function
     */
    once(event, cb) {
        this.#emitter.once(event, cb);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {(...args: any[]) => void} cb - Callback function
     */
    off(event, cb) {
        this.#emitter.off(event, cb);
    }
}

export default PerformanceMonitor;
