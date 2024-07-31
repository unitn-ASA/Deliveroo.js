const Controller = require('../deliveroo/Controller')
const config =  require('../../config');


// Holds the classes of agents dynamically loaded
var controllerClasses = {};
var mapControllerAgent = {};

// Holds the grid
var grid;

// the initialization focus on the dynamic load of the different controller classes
function init(newGrid) {
  grid = newGrid;
  mapControllerAgent = process.env.AGENTSCONTROLLER || config.AGENTSCONTROLLER;

  //set manualy the default Controller class
  controllerClasses['Controller'] = Controller;

  // Dynamically load agent classes
  Object.values(mapControllerAgent).forEach(controllerName => {
    if(controllerName != 'Controller'){
      try {
        controllerClasses[controllerName] = require(`../extensions/controllers/${controllerName}`);
      } catch (error) {
        console.error(`Class ${controllerName} not founded`);
      }
    }
  });
}


function getController(socket){
  try {

    // Get the the agent that will be associeted with the controller
    const agent = grid.menagerAgents.authenticate(socket);
  
    const controllerName = mapControllerAgent[agent.constructor.name];
    
    if (controllerName && controllerClasses[controllerName]) {
      let ControllerClass = controllerClasses[controllerName]
      let controller = new ControllerClass(agent,grid)
      return controller
    } else {
      console.error(`Controller for type ${agent.constructor.name} not found, associated a default controller`);
      let controller = new Controller(agent,grid)
      return controller;
    }

  } catch (error) {
    console.error('ERROR getController: ', error)
  }
  
}



module.exports = { init, getController };