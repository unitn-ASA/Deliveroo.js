import Grid from './deliveroo/Grid.js';
import { config, configEmitter } from './config/config.js';
import { pluginRegistry } from './plugins/runtime.js';
import ParcelSpawnerPlugin from './plugins/builtins/ParcelSpawnerPlugin.js';
import NPCSpawnerPlugin from './plugins/builtins/NPCSpawnerPlugin.js';



const myGrid = new Grid(config.GAME.map.tiles);
console.log(`myGrid.js: Grid initialized with map size ${myGrid.tileRegistry.getMaxXy()} from game '${config.GAME.title}'`);

configEmitter.on('GAME', async () => {
    if ( config.GAME.map?.tiles && Array.isArray(config.GAME.map.tiles) ) {
        myGrid.loadMap( config.GAME.map.tiles );
        console.log(`myGrid.js: Grid map updated with new configuration, new map size ${myGrid.tileRegistry.getMaxXy()}`);
    }
});



/**
 * Expose the grid to plugins through the registry context.
 * Plugin registration/startup happens in ioServer.js, where the command bus lives.
 */
pluginRegistry.attachGrid(myGrid);

/**
 * Game-behavior plugins: parcel and NPC spawning.
 * Both depend only on the grid, so they start here rather than in ioServer.js.
 */
const parcelSpawnerPlugin = pluginRegistry.register(new ParcelSpawnerPlugin());
pluginRegistry.start(parcelSpawnerPlugin.id)
    .then(ok => ok
        ? console.log(`✅ Plugin ${parcelSpawnerPlugin.id} started`)
        : console.error(`❌ Failed to start plugin ${parcelSpawnerPlugin.id}:`, parcelSpawnerPlugin.lastError))
    .catch(error => console.error(`❌ Failed to start plugin ${parcelSpawnerPlugin.id}:`, error));

const npcSpawnerPlugin = pluginRegistry.register(new NPCSpawnerPlugin());
pluginRegistry.start(npcSpawnerPlugin.id)
    .then(ok => ok
        ? console.log(`✅ Plugin ${npcSpawnerPlugin.id} started`)
        : console.error(`❌ Failed to start plugin ${npcSpawnerPlugin.id}:`, npcSpawnerPlugin.lastError))
    .catch(error => console.error(`❌ Failed to start plugin ${npcSpawnerPlugin.id}:`, error));



export { myGrid };
