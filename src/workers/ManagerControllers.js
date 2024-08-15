const Controller = require('../deliveroo/Controller')
const config =  require('../../config');
const ManagerAgent = require('./ManagerAgents');


var controllerClasses = {};             // Map associating name to the class of each controller type


function loadPlugin(PluginName) {

  /*In the controller plugin setting the standard entries are
      - SUBJECTS: indicates the type of Agent to which the controller is associated. Can contain multiple Agent types.
                  if the type is already associated with another controller, it overwrites the old information 
  */

  if (!config.AGENTSCONTROLLER)  config.AGENTSCONTROLLER = {};

  // load the extension of the plugin in the controllers register
  let controllerPlugin = require(`../plugins/controllers/${PluginName}`)     // get the plugin from the controller's plugins folder
  controllerClasses[controllerPlugin.name] = controllerPlugin.extension;     // create a name-class entry for the loaded controller
  
  // define the associations of this controller with the agent it can control
  if (controllerPlugin.settings && controllerPlugin.settings.SUBJECTS) {
      for (let subject of controllerPlugin.settings.SUBJECTS) {                          // for each agent it can controll
          if (config.AGENTSCONTROLLER.hasOwnProperty(subject)) {                         //  - chack that the agents isn't already associeted with other controllers, if the agent is already associeted, the manager replaces the old controller with the new one
              console.warn(`Controller ${config.AGENTSCONTROLLER.subject} is being overwritten in AGENTSCONTROLLER by ${controllerPlugin.name} fot the Agent ${subject}.`);   
          }
          config.AGENTSCONTROLLER[subject] = controllerPlugin.name;                      //  - associeted Controller and Agent
          
      }
  }

  // if the plugin has settings the manager load them on file config
  if(controllerPlugin.settings){
    for (let key in controllerPlugin.settings) {                 // Iterate over each setting and add it to the config
      if (!config[key] && key != 'SUBJECTS') {                   // set the new setting only if it not already defined 
          config[key] = controllerPlugin.settings[key];          // the SUBJECTS is not added in the standard way
      }
    }
  }                       

}


function getController( agent, grid ){

  if(!agent){
    console.log('EROOR LOG IN');
    return
  }

  let mapControllerAgent = config.AGENTSCONTROLLER;
  
  // Get the controller type associeted with the agent type of the socket
  let controllerType = mapControllerAgent[agent.constructor.name] 

  // If the controller type is found generete the corrrect controller, otherway generete a defoul controller
  if (controllerType && controllerClasses[controllerType]) {
    let ControllerClass = controllerClasses[controllerType]
    let controller = new ControllerClass(agent, grid)
    return controller
  } else {
    console.error(`Controller for type ${agent.constructor.name} not found, associated a default controller`);
    let controller = new Controller(agent, grid)
    return controller;
  }

}


const ManagerControllers = { loadPlugin, getController}


module.exports = ManagerControllers;