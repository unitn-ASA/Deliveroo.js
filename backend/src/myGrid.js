import Grid from './deliveroo/Grid.js';
import { config, configEmitter } from './config/config.js';
import ParcelSpawner from './workers/ParcelSpawner.js';
import NPCspawner from './workers/NPCspawner.js';



const myGrid = new Grid(config.GAME.map.tiles);
console.log(`myGrid.js: Grid initialized with map size ${myGrid.tileRegistry.getMaxXy()} from game '${config.GAME.title}'`);

configEmitter.on('GAME', async () => {
    if ( config.GAME.map?.tiles && Array.isArray(config.GAME.map.tiles) ) {
        myGrid.loadMap( config.GAME.map.tiles );
        console.log(`myGrid.js: Grid map updated with new configuration, new map size ${myGrid.tileRegistry.getMaxXy()}`);
    }
});

const myParcelSpawner = new ParcelSpawner(myGrid);
console.log(`myGrid.js: ParcelSpawner initialized`);

const myNPCSpawner = new NPCspawner(myGrid, config.GAME.npcs || []);
console.log(`myGrid.js: NPCSpawner initialized with options`, config.GAME.npcs || []);
configEmitter.on('GAME', async () => {
    let npcsOptions = config?.GAME?.npcs || [];
    myNPCSpawner.applyOptions( npcsOptions );
    console.log(`myGrid.js: NPCSpawner options updated`, npcsOptions);
});

export { myGrid, myParcelSpawner, myNPCSpawner };
