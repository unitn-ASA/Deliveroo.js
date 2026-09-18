import Grid from './core/Grid.js';
import { config, configEmitter } from './config/config.js';
import { pluginRegistry } from './plugins/runtime.js';
import ParcelSpawnerPlugin from './plugins/builtins/ParcelSpawnerPlugin.js';
import NPCSpawnerPlugin from './plugins/builtins/NPCSpawnerPlugin.js';
import MovementModesPlugin from './plugins/movementModes/MovementModesPlugin.js';



const myGrid = new Grid(config.GAME.map.tiles);
console.log(`myGrid.js: Grid initialized with map size ${myGrid.tiles.getMaxXy()} from game '${config.GAME.title}'`);

configEmitter.on('GAME', async () => {
    if ( config.GAME.map?.tiles && Array.isArray(config.GAME.map.tiles) ) {
        myGrid.loadMap( config.GAME.map.tiles );
        console.log(`myGrid.js: Grid map updated with new configuration, new map size ${myGrid.tiles.getMaxXy()}`);
    }
    await startConfiguredPlugins();
});



/**
 * Expose the grid to plugins through the registry context.
 * Plugin registration/startup happens in ioServer.js, where the command bus lives.
 */
pluginRegistry.attachGrid(myGrid);

/**
 * @type {Set<string>} plugins auto-started from the game configuration,
 * so a configuration change can stop the ones it no longer lists
 */
const configStartedPlugins = new Set();

/**
 * Load and start every plugin configured in config.GAME.plugins that is
 * not running yet, and stop the plugins this configuration auto-started
 * that are no longer listed (plugins started by an admin are left alone).
 * Called at boot and on configuration changes.
 */
async function startConfiguredPlugins() {
    const configured = new Set(config.GAME.plugins ?? []);

    for (const pluginId of configured) {
        try {
            if (!pluginRegistry.has(pluginId)) {
                await pluginRegistry.loadById(pluginId);
            }
            if (!pluginRegistry.runningPlugins.has(pluginId)) {
                const ok = await pluginRegistry.start(pluginId);
                if (ok) {
                    configStartedPlugins.add(pluginId);
                    console.log(`✅ Plugin ${pluginId} started`);
                } else {
                    console.error(`❌ Failed to start plugin ${pluginId}:`, pluginRegistry.get(pluginId)?.lastError);
                }
            }
        } catch (error) {
            console.error(`❌ Failed to load plugin ${pluginId}:`, error.message);
        }
    }

    for (const pluginId of Array.from(configStartedPlugins)) {
        if (configured.has(pluginId)) continue;
        configStartedPlugins.delete(pluginId);
        if (pluginRegistry.runningPlugins.has(pluginId)) {
            const ok = await pluginRegistry.stop(pluginId);
            if (ok) {
                console.log(`🛑 Plugin ${pluginId} stopped (no longer configured)`);
            } else {
                console.error(`❌ Failed to stop plugin ${pluginId}:`, pluginRegistry.get(pluginId)?.lastError);
            }
        }
    }
}

/**
 * Optional movement modes. The core standard preset is already registered,
 * so NPC spawning does not depend on this plugin being active.
 */
const movementModesPlugin = pluginRegistry.register(new MovementModesPlugin());
try {
    const ok = await pluginRegistry.start(movementModesPlugin.id);
    if (ok) {
        console.log(`✅ Plugin ${movementModesPlugin.id} started`);
    } else {
        console.error(`❌ Failed to start plugin ${movementModesPlugin.id}:`, movementModesPlugin.lastError);
    }
} catch (error) {
    console.error(`❌ Failed to start plugin ${movementModesPlugin.id}:`, error);
}

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

/**
 * Game-mode plugins configured by the current game (config.GAME.plugins).
 */
await startConfiguredPlugins();



export { myGrid };
