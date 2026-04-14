
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

    /** @type {bigint} Start-up process.hrtime.bigint() */
    #start_hrtime;
    /** @type {number} Start-up frame clock.frame */
    #start_frame;
    /** @type {number} Start-up virtual milliseconds clock.ms */
    #start_ms;
    /** @type {number} Start time Date.now() */
    #start_time;



    /** @type { {frame: number, ms: number, time: number, hrtime: bigint, cpuPercent: number, lag: number, cpuUsage: number}[] } */
    #samples = [];
    #maxSamples = 20;

    get last_sample() {
        return this.#samples[this.#samples.length - 1];
    }
    /** @type {number} Current frame */
    get last_frame() {
        return this.last_sample?.frame || 0;
    }
    /** @type {number} Current virtual milliseconds */
    get last_ms() {
        return this.last_sample?.ms || 0;
    }
    /** @type {number} Previous time Date.now() */
    get last_time() {
        return this.last_sample?.time || 0;
    }
    /** @type {bigint} Current process.hrtime.bigint() */
    get last_hrtime() {
        return this.last_sample?.hrtime || process.hrtime.bigint();
    }
    /** @type {number} Current CPU percentage */
    get last_cpuPercent() {
        return this.last_sample?.cpuPercent || 0;
    }
    /** @type {number} Current event loop lag in ms */
    get last_lag() {
        return this.last_sample?.lag || 0;
    }
    /** @type {number} Current CPU usage */
    get last_cpuUsage() {
        return this.last_sample?.cpuUsage || 0;
    }



    // Ping/Pong latency tracking - per socket
    /** @type {Map<string, {socketId: string, id: string, name: string, teamId: string, teamName: string, maxRoundTrip: number, minRoundTrip: number, bufferedRoundTrip: number[]}>} */
    #latencySamplesBySocket = new Map();
    #maxLatencySamplesPerSocket = 50;



    /**
     * Metrics cache, computed on demand every 10s or when computeMetrics() is called
     * @type {IOMetrics}
     */
    #metricsCache = {
        timing: {
            ms: 0,
            frame: 0,
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



    /**
     * @param {number} ms - Current milliseconds
     * @param {number} frame - Current frame number
     */
    constructor(ms, frame) {
        // Initialize first sampled event loop time and virtual ms for lag calculation
        this.#start_hrtime = process.hrtime.bigint();
        this.#start_ms = ms || 0;
        this.#start_frame = frame || 0;
        this.#start_time = Date.now();
        
        // Sample initial metrics
        this.sample(ms, frame);
    }

    /**
     * Sample performance metrics given current time and frame.
     * This should be called on every frame to update internal state, but expensive computations are deferred until requested.
     * @param {number} ms - Current milliseconds
     * @param {number} frame - Current frame number
     */
    sample(ms, frame) {
        
        const sample = {
            frame,
            ms,
            elapsed_ms: 0,
            time: Date.now(),
            hrtime: process.hrtime.bigint(),
            elapsed_hrtime: 0,
            cpuUsage: process.cpuUsage().user,
            elapsed_cpuUsage: 0,
            cpuPercent: 0,
            lag: 0,
        };
        
        // const elapsed_frame = frame - this.#last_frame;
        sample.elapsed_ms = ms - this.last_ms;
        sample.elapsed_hrtime = ( Number(sample.hrtime) - Number(this.last_hrtime) ) / 1000000; // Convert to ms
        sample.elapsed_cpuUsage = sample.cpuUsage - this.last_cpuUsage; // CPU time used since last sample in microseconds
        
        // Calculate CPU percentage
        sample.cpuPercent = (sample.elapsed_cpuUsage / 1000) / sample.elapsed_hrtime * 100; // Convert to percentage

        // Calculate lag as the difference between the actual elapsed time and the expected elapsed time based on the virtual game time (ms) between the last two samples.
        // This gives us an estimate of how much the event loop is lagging behind the expected timing of the game loop.
        sample.lag = sample.elapsed_hrtime - sample.elapsed_ms;
        
        // Push sample and remove old samples to prevent unbounded memory growth
        this.#samples.push(sample);
        if (this.#samples.length > this.#maxSamples) {
            this.#samples.shift();
        }

        // Mark metrics as dirty to trigger recomputation when requested
        this.#isdirty = true;
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
                ms: this.last_ms,
                frame: this.last_frame,
                fps: this.#computeFps(),
                uptime: this.last_time - this.#start_time
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
        // if (this.#samples.length < 1)
        //     return Math.round(this.last_frame / (Date.now() - this.#start_time) * 1000 * 10) / 10;
        let lastI = this.#samples.length - 1;
        let firstI = lastI - back < 0 ? 0 : lastI - back;
        const last = this.#samples[lastI];
        const first = this.#samples[firstI];
        return Math.round((last.frame - first.frame) / (last.time - first.time) * 1000 * 10) / 10;
    }

    /**
     * Calculate avg CPU usage over the last samples
     * @returns {number} CPU usage percentage (0-100)
     */
    #computeAvgCpuUsage() {
        if (this.#samples.length === 0)
            return 0;
        const avgCpu = this.#samples.reduce( (cumulated, sample) => cumulated + sample.cpuPercent, 0 ) / this.#samples.length;
        return Math.round(avgCpu);
    }

    /**
     * Get current event loop lag in milliseconds
     * @returns {{current: number, avg: number, max: number}} Lag in milliseconds
     */
    #computeEventLoopLag() {
        if (this.#samples.length === 0)
            return { current: 0, avg: 0, max: 0 };

        // Return current, average, and max lag
        return {
            current: Math.round(this.#samples[this.#samples.length - 1].lag),
            avg: Math.round( this.#samples.reduce((a, b) => a + b.lag, 0) / this.#samples.length ),
            max: Math.max(...this.#samples.map(s => s.lag)),
            // avg: Math.round( ( (this.#last_time - this.#start_time) - ( this.#last_ms - this.#start_ms ) ) / ( this.#last_frame - this.#start_frame ) ) // Avg lag per frame since start in ms
        };
    }

    /**
     * Get latency statistics including per-socket breakdown
     * @returns { { avg: number, min: number, max: number }} Latency statistics
     */
    #computeLatencyStats() {

        const latencySampledArray = Array.from(this.#latencySamplesBySocket.values());
        const allSampledRoundTrips = latencySampledArray.map(s => s.bufferedRoundTrip).flat();
        const sum = allSampledRoundTrips.reduce((a, b) => a + b, 0);
        const avg = allSampledRoundTrips.length > 0 ? Math.round(sum / allSampledRoundTrips.length) : 0;
        const min = Math.min(...allSampledRoundTrips, 0); // Default to 0 if no samples
        const max = Math.max(...allSampledRoundTrips, 0); // Default to 0 if no samples

        return { avg, min, max };
    }

    /**
     * Compute latency statistics grouped by agent
     * @returns {object} Agent-grouped latency statistics
     */
    #computeLatencyByAgent() {

        // Group latency samples by agent (id + teamId) and calculate average round trip time per socket for each agent
        const byAgent = {};

        // for each socket
        for (const [socketId, latencySamplesBySocket] of this.#latencySamplesBySocket.entries()) {
            
            const bufferedRoundTrip = latencySamplesBySocket.bufferedRoundTrip;
            const maxRoundTrip = latencySamplesBySocket.maxRoundTrip;
            const minRoundTrip = latencySamplesBySocket.minRoundTrip;
            const sumRoundTrip = bufferedRoundTrip.reduce((a, b) => a + b, 0);
            const avgRoundTrip = bufferedRoundTrip.length > 0 ? Math.round(sumRoundTrip / bufferedRoundTrip.length) : 0;

            // if no samples for this socket, skip
            if (bufferedRoundTrip.length === 0)
                continue;

            const latestSample = bufferedRoundTrip[bufferedRoundTrip.length - 1];
            const agentKey = `${latencySamplesBySocket.id}-${latencySamplesBySocket.teamId}`;

            // Initialize agent entry if not exists
            if ( ! byAgent[agentKey] ) {
                byAgent[agentKey] = {
                    id: latencySamplesBySocket.id,
                    name: latencySamplesBySocket.name,
                    teamId: latencySamplesBySocket.teamId,
                    teamName: latencySamplesBySocket.teamName,
                    sockets: []
                };
            }

            byAgent[agentKey].sockets.push({
                socketId: socketId,
                avg: avgRoundTrip,
                min: minRoundTrip,
                max: maxRoundTrip
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
        
        let socketSamples = this.#latencySamplesBySocket.get(pingData.socketId);
        
        // Get or create array for this socket
        if ( ! socketSamples ) {
            socketSamples = { ...pingData, bufferedRoundTrip: [], minRoundTrip: pingData.roundTrip, maxRoundTrip: pingData.roundTrip };
            this.#latencySamplesBySocket.set( pingData.socketId, socketSamples );
        }

        socketSamples.minRoundTrip = Math.min( socketSamples.minRoundTrip, pingData.roundTrip );
        socketSamples.maxRoundTrip = Math.max( socketSamples.maxRoundTrip, pingData.roundTrip );
        socketSamples.bufferedRoundTrip.push( pingData.roundTrip );

        // Keep only recent samples per socket
        if (socketSamples.bufferedRoundTrip.length > this.#maxLatencySamplesPerSocket) {
            socketSamples.bufferedRoundTrip.shift();
        }

    }

}

export default PerformanceMonitor;
