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
    let entityClassesList = process.env.ENTITIES || config.ENTITIES;
    
    entityClassesList.forEach(entityName => {
    try {
        entityClasses[entityName] = require(`../extensions/entities/${entityName}`);
    } catch (error) {
        console.error(`Class ${entityName} not founded`);
    }
    });

    // for each class menage the generation of the 
    Object.keys(entityClasses).forEach(entityName => {

        //derive frome te env or config file the information about the generation
        const interval = process.env[`${entityName.toUpperCase()}_GENERATION_INTERVAL`] || config[`${entityName.toUpperCase()}_GENERATION_INTERVAL`] || false;
        const max = process.env[`${entityName.toUpperCase()}_MAX`] || config[`${entityName.toUpperCase()}_MAX`] || 0;
        const EntityClass = entityClasses[entityName];
    
        console.log('Entity: ', entityName + ' max: ', max)

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
            .filter(t => t.type == 'spawner')
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
            .filter(t => t.type == 'spawner')
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

