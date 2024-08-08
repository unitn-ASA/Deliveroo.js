const myClock =  require('../deliveroo/Clock');
const config =  require('../../config');


var entityClasses = {}    // Map associating name to the class of each entoty type


function loadPlugin(PluginName){  

  /*In the entity plugin setting the standard entries are
        - ENTITY_GENERATION_INTERVAL: indicates the time between 2 consecutive spawns of this entity type. 
                Accepted values ​​are: '1s', '2s', '5s', '10s', 'infinite'. if the entry is not defined all entities
                will be generated when the game initializes.
        - ENTITY_MAX: indicates the max number for the specific type entity
        - ENTITY_SPAWN_TILE: indicate the type of tile on which the entity can spawn. if it is not specified the default type is 'spawner'
  */
  
  if (!config.ENTITIES)  config.ENTITIES = [];     
              
  // load the extension of the plugin in the entities register
  let entityPlugin = require(`../plugins/entities/${PluginName}`)     // get the plugin from the entity's plugins folder
  entityClasses[entityPlugin.name] = entityPlugin.extension           // create a name-class entry for the loaded entity
  
  // if the plugin has settings the manager load them on file config 
  if(entityPlugin.settings){                      
    for (let key in entityPlugin.settings) {                 // Iterate over each setting and add it to the config
        if (!config[key]) {                                  // set the new setting only if it not already defined 
            config[key] = entityPlugin.settings[key];
        }
    } 
  }

  // Add the name of the entity type of the extension in the list of entities in the game
  config.ENTITIES.push(entityPlugin.name)                  

}


function managerSpawnEntities(grid) {
    
  // for each entity type in the game menage its generation 
  Object.keys(entityClasses).forEach(entityName => {

      //derive frome the config file the information about the generation, if it is not possible use the default settings
      const interval = config[`${entityName.toUpperCase()}_GENERATION_INTERVAL`] || false;
      const max = config[`${entityName.toUpperCase()}_MAX`] || 0;
      const spawn_type_tile = config[`${entityName.toUpperCase()}_SPAWN_TILE`] || 'spawner';

      //take the class for the specific entity
      const EntityClass = entityClasses[entityName];
      if (!EntityClass) {
        console.error(`Class for entity type ${entityName} not found; skip the generation.`);
        return;
      }

      // If the intervall is null, it will generate all the entities immidiatly 
      if(!interval){ 
          
        // defines the set of tiles the entity can spawn on
        let tiles_with_no_entities =
        Array.from(grid.getTiles())               // From all the tiles takes only those
        .filter(t => t.type == spawn_type_tile)   // - which type is the same as the spawn type tiles of entity
        .filter(t =>                              // - that doesn't already have an entity on it
            Array.from(grid.getEntities())
            .find(e => e.x == t.x && e.y == t.y ) == undefined
        );

        //shaffol the array of tiles for a randome selection of the spawn tile
        for (let i = tiles_with_no_entities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles_with_no_entities[i], tiles_with_no_entities[j]] = [tiles_with_no_entities[j], tiles_with_no_entities[i]];
        }

        // select a set of compliant tiles, with a number equal to the maximum number of entities, and generate an entity for each one
        tiles_with_no_entities.slice(0, max).forEach(tile => {
          let entity = new EntityClass(tile, grid);
        }); 

      }
      // if the inteval is defined, the manager spawn one entity for each interval
      else{

        myClock.on(interval, () => {                                         // At each interval:
          
          if (grid.getEntitiesQuantity(entityName.toLowerCase()) >= max) {   // - checks whether the maximum number of entities has already been reached
            return;                                                          //    if yes skip the generation 
          }
  
          let tiles_with_no_entities =                                       // - defines the set of tiles the entity can spawn on                                     
            Array.from(grid.getTiles())                                      //    From all the tiles takes only those
            .filter(t => t.type == spawn_type_tile)                          //     - which type is the same as the spawn type tiles of entity
            .filter(t =>                                                     //     - that doesn't already have an entity on it
              Array.from(grid.getEntities())
              .find(e => e.x == t.x && e.y == t.y ) == undefined
            );

          if (tiles_with_no_entities.length > 0) {                           // - if the set of tiles is not empty
            let i = Math.floor(Math.random()*tiles_with_no_entities.length); //    - take a random tile 
            let tile = tiles_with_no_entities.at(i);                         

            let entity = new EntityClass(tile, grid);                        //    - generate on it the new entity                     
          }
        });

      }
  
      
    });

}


const ManagerEntities = { loadPlugin, managerSpawnEntities}

module.exports = ManagerEntities;

