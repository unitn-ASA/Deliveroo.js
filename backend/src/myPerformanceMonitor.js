import PerformanceMonitor from './PerformanceMonitor.js';
import myClock from './myClock.js';
import { config } from './config/config.js';

const performanceMonitor = new PerformanceMonitor();

// Listen to frame events to update performance metrics
myClock.on('frame', () => {
    performanceMonitor.sample(myClock.ms, myClock.frame);
});

// Log performance info every 5 seconds
myClock.on('10s', () => {
    const metrics = performanceMonitor.getPerformanceMetrics();
    console.log('FRAME', `#${myClock.frame}`, `@${config.CLOCK}ms/frame`, `${metrics.timing.fps}fps`,
        `Heap: ${metrics.memory.heapUsed}/${metrics.memory.heapTotal}MB`,
        `CPU: ${metrics.cpu.current}%`,
        `EventLoopAvgLag: ${metrics.eventLoop.avgLag}ms`,
        `AvgLatency: ${metrics.latency.avg}(${metrics.latency.min}-${metrics.latency.max})ms`);
});

export default performanceMonitor;
