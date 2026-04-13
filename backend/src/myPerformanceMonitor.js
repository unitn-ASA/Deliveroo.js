import PerformanceMonitor from './PerformanceMonitor.js';
import myClock from './myClock.js';
import { config } from './config/config.js';

const performanceMonitor = new PerformanceMonitor();

// Initialize with clock settings
performanceMonitor.setBase(Number(config.CLOCK));
performanceMonitor.setStartTime(Date.now());

// Listen to frame events to update performance metrics
myClock.on('frame', () => {
    performanceMonitor.updateTime(myClock.ms, myClock.frame);
    performanceMonitor.sample();
});

// Log performance info every 5 seconds
myClock.on('10s', () => {
    const info = performanceMonitor.info;
    console.log('FRAME', `#${myClock.frame}`, `@${config.CLOCK}ms`, info.fps, 'fps',
        `Heap: ${info.heapUsed}MB used of ${info.heapTotal}MB total`,
        `CPU: ${info.cpuUsage}%`,
        `Event Loop Lag: ${info.eventLoopLag}ms`,
        `Avg Latency: ${info.avgLatency}ms`);
});

export default performanceMonitor;
