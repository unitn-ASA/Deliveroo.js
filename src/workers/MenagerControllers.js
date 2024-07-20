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

  // Dynamically load agent classes
  Object.values(mapControllerAgent).forEach(controllertName => {
    console.log(controllertName)
      try {
          controllerClasses[controllertName] = require(`../extensions/controllers/${controllertName}`);
      } catch (error) {
          console.error(`Class ${controllertName} not founded`);
      }
  });
}


function getController(agent){
  
  const controllerName = mapControllerAgent[agent.constructor.name];
  
  if (controllerName && controllerClasses[controllerName]) {
    let ControllerClass = controllerClasses[controllerName]
    let controller = new ControllerClass(agent,grid)
    return controller
  } else {
    console.error(`Controller for type ${agent.constructor.name} not found`);
    return null;
  }
}

module.exports = { init, getController };