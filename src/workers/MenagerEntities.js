const Grid = require('../deliveroo/Grid');
const myClock =  require('../deliveroo/Clock');
const config =  require('../../config');


/**
 * 
 * @param {Grid} grid 
 */
module.exports = function (grid) {
    
    // Dynamically load entity classes
    const entityClasses = {}
    let entityClassesList = config.ENTITIES;
    
    entityClassesList.forEach(entityName => {
    try {
        let entityPlugin = require(`../plugins/entities/${entityName}`)
        entityClasses[entityName] = entityPlugin.core
    } catch (error) {
        console.error(`Class ${entityName} not founded`);
    }
    });

    // for each class menage the generation of the 
    Object.keys(entityClasses).forEach(entityName => {

        //derive frome the config file the information about the generation
        const interval = config[`${entityName.toUpperCase()}_GENERATION_INTERVAL`] || false;
        const max = config[`${entityName.toUpperCase()}_MAX`] || 0;
        const spawn_type_tile = config[`${entityName.toUpperCase()}_SPAWN_TILE`] || 'spawner';

        const EntityClass = entityClasses[entityName];

        if (!EntityClass) {
          console.error(`Class for entity type ${entityName} not found; skip the generation.`);
          return;
        }

        // If the intervall is null, it will generate all the entities immidiatly 
        if(!interval){
           // Genera tutte le entità in una volta sola
            let tiles_with_no_entities =
            Array.from(grid.getTiles())
            // entity spawner tile
            .filter(t => t.type == spawn_type_tile)
            // no entities exist on the tile
            .filter(t =>
                Array.from(grid.getEntities())
                .find(e =>
                e.x == t.x && e.y == t.y
                ) == undefined
            );

            //shaffol the array of tiles for a randome selection of the spawn tile
            for (let i = tiles_with_no_entities.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [tiles_with_no_entities[i], tiles_with_no_entities[j]] = [tiles_with_no_entities[j], tiles_with_no_entities[i]];
            }

            tiles_with_no_entities.slice(0, max).forEach(tile => {
                let entity = new EntityClass(tile, grid);
            }); 
            
            return
        }
    
        myClock.on(interval, () => {
            
          if (grid.getEntitiesQuantity(entityName.toLowerCase()) >= max) {
            return;
          }

          let tiles_with_no_entities =
            Array.from(grid.getTiles())
            // entity spawner tile
            .filter(t => t.type == spawn_type_tile)
            // no entities exists on the tile
            .filter(t =>
              Array.from(grid.getEntities())
              .find(e =>
                e.x == t.x && e.y == t.y
              ) == undefined
            );
          if (tiles_with_no_entities.length > 0) {
            let i = Math.floor(Math.random() * tiles_with_no_entities.length);
            let tile = tiles_with_no_entities.at(i);
    
            let entity = new EntityClass(tile, grid);
          }
        });
      });

}

