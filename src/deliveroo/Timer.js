const EventEmitter = require('events');

class Timer extends EventEmitter {
  
  constructor(time) {
    super();
    this.time = time;               // Initial time of the timer
    this.remainingTime = time;      // Remaining time of the timer
    this.intervalId = null;         // Interval ID for the timer
    this.running = false;           // Indicates if the timer is currently running
  }

  // Method to start the timer
  start() {
    
    if (!this.running) {            // Check if the timer is not already running
      this.running = true;          // Set the running flag to true
      this.emit('timer started');   // Emit a 'timer started' event
        
      // Create an interval that decrements the remaining time of the timer evry 1 second
      this.intervalId = setInterval(() => {
        this.remainingTime -= 1; // Decrease the remaining time by 1 second
        this.emit('timer update', this.remainingTime);
        
        // Check if the remaining time has expired
        if (this.remainingTime <= 0) {
          this.stop();              // Stop the timer
          this.emit('timer ended'); // Emit a 'timer ended' event to indicate that the timer has ended
          this.destroy();           // Destroy the timer instance
        }
      }, 1000); 
    }
  }

  // Method to stop the timer
  stop() {
    
    if (this.running) {             // Check if the timer is currently running
      this.running = false;         // Set the running flag to false

      clearInterval(this.intervalId);   // Clear the timer interval
      this.emit('timer stopped');       // Emit a 'timer stopped' event to indicate that the timer has been stopped
    }
  }


  async destroy() {
    this.removeAllListeners();     // Remove all listeners
  }
}

module.exports = Timer; // Export the Timer class for use in other files