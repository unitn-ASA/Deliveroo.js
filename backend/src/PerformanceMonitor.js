import { performance } from 'perf_hooks';
import EventEmitter from 'events';

/**
 * @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOSocketEvents.js').IOMetrics} IOMetrics
 */

/**
 * @typedef { {socketId: string, id: string, name: string, teamId: string, teamName: string, frame: number, roundTrip: number} } LogData
 */

/**
 * Performance monitoring system that tracks CPU, memory, event loop lag, and latency
 * @class PerformanceMonitor
 */
class PerformanceMonitor {

    /** @type {number} Current milliseconds */
    #sampledMs = 0;

    /** @type {number} Current frame */
    #sampledFrame = 0;

    /** @type {number} Start time for fps calculation */
    #startTime = Date.now();

    // Timing samples for FPS
    #timingSamples = [];
    #maxSamples = 50;

    // Performance monitoring
    #lastSampledCpuUsage = process.cpuUsage();
    #lastSampledCpuSampleTime = process.hrtime.bigint();
    #cpuSamples = [];
    #maxCpuSamples = 50;

    // Event loop lag monitoring
    #lastSampledEventLoopTime = process.hrtime.bigint();
    #eventLoopLagSamples = [];
    #maxLagSamples = 50;

    // Ping/Pong latency tracking - per socket
    /** @type {Map<string, LogData[]>} */
    #latencySamplesBySocket = new Map();
    #maxLatencySamplesPerSocket = 50;



    /**
     * Metrics cache, computed on demand every 10s or when computeMetrics() is called
     * @type {IOMetrics}
     */
    #metricsCache = {
        timing: {
            ms: this.#sampledMs,
            frame: this.#sampledFrame,
            fps: 0,
            uptime: 0
        },
        memory: {
            heapUsed: 0,
            heapTotal: 0,
            rss: 0,
            external: 0
        },
        cpu: {
            current: 0
        },
        eventLoop: {
            currentLag: 0,
            maxLag: 0,
            avgLag: 0
        },
        latency: {
            avg: 0,
            min: 0,
            max: 0,
            byAgent: {}
        }
    };

    constructor() {
    }

    /**
     * Sample performance metrics given current time and frame.
     * This should be called on every frame to update internal state, but expensive computations are deferred until requested.
     * @param {number} ms - Current milliseconds
     * @param {number} frame - Current frame number
     */
    sample(ms, frame) {
        this.#sampledMs = ms;
        this.#sampledFrame = frame;
        
        // Sample timing for FPS calculation
        this.#sampleTiming();

        // Sample CPU usage
        this.#sampleCpuUsage();

        // Monitor event loop lag
        this.#sampleEventLoopLag();

        this.#isdirty = true; // Mark metrics as dirty to trigger recomputation when requested
    }

    /**
     * Sample CPU usage
     * @returns {void}
     */
    #sampleCpuUsage() {
        const currentUsage = process.cpuUsage();
        const now = process.hrtime.bigint();

        const elapsedUsage = currentUsage.user - this.#lastSampledCpuUsage.user;
        const elapsedTime = Number(now - this.#lastSampledCpuSampleTime) / 1000000; // Convert to ms

        // Calculate CPU percentage (actual elapsed time, not expected base interval)
        const cpuPercent = elapsedTime > 0
            ? Math.min(100, (elapsedUsage / 1000) / elapsedTime * 100)
            : 0;

        this.#lastSampledCpuUsage = currentUsage;
        this.#lastSampledCpuSampleTime = now;

        // Store sample for averaging
        this.#cpuSamples.push(cpuPercent);
        if (this.#cpuSamples.length > this.#maxCpuSamples) {
            this.#cpuSamples.shift();
        }
    }

    /**
     * Sample timing for FPS calculation
     * This should be called on every frame to update the timing samples, but the actual FPS calculation is deferred until requested to avoid expensive computations on every frame
     */
    #sampleTiming() {
        // Sample timing for FPS calculation
        this.#timingSamples.push({
            frame: this.#sampledFrame,
            time: Date.now(),
            hrtime: process.hrtime.bigint()
        });
        // Remove old samples to prevent unbounded memory growth
        if (this.#timingSamples.length > this.#maxSamples) {
            this.#timingSamples.shift();
        }
    }

    /**
     * Sample event loop lag using setImmediate timing
     * This should be called on every frame to update the event loop lag samples, but the actual lag calculation is deferred until requested to avoid expensive computations on every frame
     */
    #sampleEventLoopLag() {
        const now = process.hrtime.bigint();
        const lag = Number(now - this.#lastSampledEventLoopTime) / 1000000; // Convert to ms

        this.#eventLoopLagSamples.push(lag);
        if (this.#eventLoopLagSamples.length > this.#maxLagSamples) {
            this.#eventLoopLagSamples.shift();
        }

        this.#lastSampledEventLoopTime = now;
    }



    /**
     * Flag to indicate if metrics need to be recomputed
     * This is set to true whenever new samples are taken, and set to false after metrics are computed
     * This allows us to avoid expensive computations on every frame and only compute when requested (e.g., every 10s)
     * @type {boolean}
     */
    #isdirty = true;

    /**
     * Get detailed performance metrics
     * @returns {IOMetrics} Performance metrics
     */
    getPerformanceMetrics() {
        // recompute only if dirty, otherwise return cached values
        return this.#computeMetrics();
    }

    /**
     * Compute and return performance metrics.
     * This method performs expensive computations like FPS calculation, CPU averaging, event loop lag analysis, and latency statistics, but only when the underlying samples have changed since the last computation (indicated by the #isdirty flag).
     * @returns {IOMetrics} Computed performance metrics
     */
    #computeMetrics() {
        // only if dirty, otherwise return cached values
        if ( ! this.#isdirty )
            return this.#metricsCache;
        this.#isdirty = false;

        // PreCompute memory usage and event loop lag
        const memoryUsage = process.memoryUsage();
        const eventLoopLag = this.#computeEventLoopLag();

        // Update metrics cache
        this.#metricsCache = {
            timing: {
                ms: this.#sampledMs,
                frame: this.#sampledFrame,
                fps: this.#computeFps(),
                uptime: Date.now() - this.#startTime
            },
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1000000),
                heapTotal: Math.round(memoryUsage.heapTotal / 1000000),
                rss: Math.round(process.memoryUsage().rss / 1000000),
                external: Math.round(process.memoryUsage().external / 1000000)
            },
            cpu: {
                current: this.#computeAvgCpuUsage()
            },
            eventLoop: {
                currentLag: eventLoopLag.current,
                maxLag: eventLoopLag.max,
                avgLag: eventLoopLag.avg
            },
            latency: {
                ...this.#computeLatencyStats(),
                byAgent: this.#computeLatencyByAgent()
            }
        };

        return this.#metricsCache;
    }



    /**
     * Compute FPS
     * @param {number} back - Number of samples to look back
     * @returns {number} FPS
     */
    #computeFps(back = 10) {
        if (this.#timingSamples.length < 1)
            return Math.round(this.#sampledFrame / (Date.now() - this.#startTime) * 1000 * 10) / 10;
        let lastI = this.#timingSamples.length - 1;
        let firstI = lastI - back < 0 ? 0 : lastI - back;
        const last = this.#timingSamples[lastI];
        const first = this.#timingSamples[firstI];
        return Math.round((last.frame - first.frame) / (last.time - first.time) * 1000 * 10) / 10;
    }

    /**
     * Calculate avg CPU usage over the last samples
     * @returns {number} CPU usage percentage (0-100)
     */
    #computeAvgCpuUsage() {
        // Return average CPU usage
        if (this.#cpuSamples.length === 0) return 0;
        const avgCpu = this.#cpuSamples.reduce((a, b) => a + b, 0) / this.#cpuSamples.length;
        return Math.round(avgCpu);
    }

    /**
     * Get current event loop lag in milliseconds
     * @returns {{current: number, avg: number, max: number}} Lag in milliseconds
     */
    #computeEventLoopLag() {
        if (this.#eventLoopLagSamples.length === 0) return { current: 0, avg: 0, max: 0 };

        // Return current, average, and max lag
        return {
            current: Math.round(this.#eventLoopLagSamples[this.#eventLoopLagSamples.length - 1]),
            avg: Math.round( this.#eventLoopLagSamples.reduce((a, b) => a + b, 0) / this.#eventLoopLagSamples.length ),
            max: Math.max(...this.#eventLoopLagSamples)
        };
    }

    /**
     * Get latency statistics including per-socket breakdown
     * @returns { { avg: number, min: number, max: number }} Latency statistics
     */
    #computeLatencyStats() {

        const allSampledRoundTrips = Array.from(this.#latencySamplesBySocket.values()).flat().map(s => s.roundTrip);

        if (allSampledRoundTrips.length === 0) {
            return {
                avg: 0,
                min: 0,
                max: 0
            };
        }

        return {
            avg: Math.round(allSampledRoundTrips.reduce((a, b) => a + b, 0) / allSampledRoundTrips.length),
            min: Math.min(...allSampledRoundTrips),
            max: Math.max(...allSampledRoundTrips)
        };
    }

    /**
     * Compute latency statistics grouped by agent
     * @returns {object} Agent-grouped latency statistics
     */
    #computeLatencyByAgent() {

        // Group latency samples by agent (id + teamId) and calculate average round trip time per socket for each agent
        const byAgent = {};

        // for each socket
        for (const [socketId, samples] of this.#latencySamplesBySocket.entries()) {
            
            // if no samples for this socket, skip
            if (samples.length === 0)
                continue;

            const latestSample = samples[samples.length - 1];
            const agentKey = `${latestSample.id}-${latestSample.teamId}`;

            // Initialize agent entry if not exists
            if ( ! byAgent[agentKey] ) {
                byAgent[agentKey] = {
                    id: latestSample.id,
                    name: latestSample.name,
                    teamId: latestSample.teamId,
                    teamName: latestSample.teamName,
                    sockets: []
                };
            }

            // Calculate stats for this socket
            const socketRoundTrips = samples.map(s => s.roundTrip);

            byAgent[agentKey].sockets.push({
                socketId: socketId,
                avg: Math.round(socketRoundTrips.reduce((a, b) => a + b, 0) / socketRoundTrips.length),
                min: Math.min(...socketRoundTrips),
                max: Math.max(...socketRoundTrips)
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
     * Handle pong response and calculate latency (call from server)
     * @param { LogData } pingData - Original ping data with socket and agent info
     * @returns {void}
     */
    handlePong( pingData ) {

        // Get or create array for this socket
        if (!this.#latencySamplesBySocket.has( pingData.socketId )) {
            this.#latencySamplesBySocket.set( pingData.socketId, [] );
        }

        const socketSamples = this.#latencySamplesBySocket.get(pingData.socketId);
        socketSamples.push( pingData );

        // Keep only recent samples per socket
        if (socketSamples.length > this.#maxLatencySamplesPerSocket) {
            socketSamples.shift();
        }

    }

}

export default PerformanceMonitor;
