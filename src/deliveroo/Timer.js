const EventEmitter = require('events');
       
class Timer extends EventEmitter {

  time              // Initial time of the timer
  remainingTime     // Remaining time of the timer
  intervalId        // Interval ID for the timer
  run               // Flag indicates if the timer is currently running
  
  constructor() {
    super();
    this.time;    this.intervalId = null;         
    console.log(`\t- timer created:`)
  }

  // Method for rest the timer and leave it in the condition to restart from a given start time
  reset(){
    this.time = undefined;          this.remainingTime = undefined;      
    this.intervalId = null;         this.run = undefined;
    return    
  }

  // Method to start the timer
  async start(newTime) {

    //if the method has the parameter newTime it's value become the new time of the timer wich start from that it's count dowm 
    if(newTime){
      this.time = await newTime;               this.remainingTime = await newTime;      
      this.intervalId = null;                  this.run = await false;
    }
    
    if (!this.run) {                // Check if the timer is not already running
      this.run = true               // Set the run flag to true
      this.emit('timer started');   // Emit a 'timer started' event
        
      // Create an interval that decrements the remaining time of the timer evry 1 second
      this.intervalId = setInterval(() => {
        this.remainingTime -= 1; // Decrease the remaining time by 1 second
        this.emit('timer update', this.remainingTime);
        
        // Check if the remaining time has expired
        if (this.remainingTime <= 0){ 
          clearInterval(this.intervalId);   // Clear the timer interval{
          this.emit('timer ended');         // Emit a 'timer ended' event to indicate that the timer has ended
          this.reset();                     // Reset the timer instance
        }
      }, 1000); 

    }else{ return('timer alredy running') } //return a message to notify that the timer is alredy running 
    
    return('timer started')  // return a message to notify that the timer is been started 
  }

  // Method to stop the timer
  async stop() { 
    if (this.run) {                 // Check if the timer is currently running
      this.run = false;             // Set the running flag to false

      await clearInterval(this.intervalId);   // Clear the timer interval
      this.emit('timer stopped');       // Emit a 'timer stopped' event to indicate that the timer has been stopped
      return('timer stopped')           // return a message to notify that the timer is been stooped
    }else{
      return('timer alredy stop')     //return a message to notify that the timer is alredy stop 
    }
  }


  async destroy() {
    this.removeAllListeners();     // Remove all listeners
    this.run = undefined;
  }
}

module.exports = Timer; // Export the Timer class for use in other files