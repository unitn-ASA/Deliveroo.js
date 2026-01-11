import Grid from './deliveroo/Grid.js';
import { config } from './config/config.js';
import ParcelSpawner from './workers/ParcelSpawner.js';
import NPCspawner from './workers/NPCspawner.js';



const myGrid = new Grid(config.GAME.map.tiles);
console.log(`myGrid.js: Grid initialized with map size ${myGrid.getMapSize()} from game '${config.GAME.title}'`);

const myParcelSpawner = new ParcelSpawner(myGrid);
console.log(`myGrid.js: ParcelSpawner initialized`);

/** @type {NPCspawner[]} */
const myNPCSpawners = [];
for ( let npcOptions of config.GAME.npcs ) {
    const myNPCSpawner = new NPCspawner(myGrid, npcOptions);
    myNPCSpawners.push(myNPCSpawner);
    console.log(`myGrid.js: NPCSpawner initialized with options`, npcOptions);
}



export { myGrid, myParcelSpawner, myNPCSpawners };
