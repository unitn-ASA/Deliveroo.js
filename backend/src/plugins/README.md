# Plugins

A **plugin** is any component that can be started and stopped at runtime. It
receives a `context` in `init()` and acquires what it needs from it:

```javascript
/** @type {import('./PluginBase.js').PluginContext} */
const context = {
    grid,      // the game Grid; grid.emitter broadcasts game-state facts
    commands,  // the server CommandBus; one handler per command type
    plugin     // the plugin instance itself
};
```

Two integration surfaces are available:

- **Facts** (`grid.emitter`): game-state changes, any number of listeners.
  Typed subscription methods: `onTile`, `onParcel`, `onCrate`, `onAgentCreated`,
  `onAgentXy`, `onAgentScore`, `onAgentDeleted`.
- **Commands** (`context.commands`): actions entering from clients
  (`move`, `pickup`, `putdown`). Exactly **one** handler per command at a time;
  registering replaces the previous handler.

Directory layout:
- `builtins/` — real plugins shipped with the server: movement schemes and
  the parcel/NPC spawners. `MovementPlugin`, `ParcelSpawnerPlugin` and
  `NPCSpawnerPlugin` are auto-started (in `ioServer.js` and `myGrid.js`).
- `examples/` — demonstration plugins, loaded on demand.

## Built-in plugins

### MovementPlugin (`movement-standard`) — auto-started
Standard cardinal movement: `up` / `down` / `left` / `right` each move one tile
through the agent controller (action mutex, penalties and movement animation
are enforced by the controller).

### RotationMovementPlugin (`movement-rotation`)
Alternative scheme with tank-like controls:
- `left` / `right`: rotate on the spot (0=North, 1=East, 2=South, 3=West),
  taking the same time as a move
- `up`: move one tile forward in the facing direction
- `down`: move one tile backward

Movement still goes through the agent controller. Only one movement plugin
should own the `move` command at a time (registering the second one replaces
the first).

### ParcelSpawnerPlugin (`parcel-spawner`) — auto-started
Spawns parcels on spawner tiles at the configured generation rate
(`config.GAME.parcels`). Stopping it cancels the pending schedule — existing
parcels keep decaying but are not replaced; starting it resumes spawning.

### NPCSpawnerPlugin (`npc-spawner`) — auto-started
Creates and supervises the NPCs configured for the current game
(`config.GAME.npcs`), removing them all on stop and re-applying on
configuration changes. The NPC behaviors (random, intelligent) live in
`workers/`. Also backs the REST surface `GET /api/npcs`, which answers 503
while the plugin is stopped.

## Example plugins

### LeaderboardPlugin (`leaderboard-plugin`)
Consumes **facts**: subscribes to `grid.emitter.onAgentScore` and maintains a
sorted leaderboard, exposed through the plugin status
(`GET /api/plugins/leaderboard-plugin/status`).

## Writing a Plugin

```javascript
import PluginBase from './PluginBase.js';

class MyPlugin extends PluginBase {
    constructor() {
        super({
            id: 'my-plugin',
            name: 'My Plugin',
            version: '1.0.0',
            description: 'Does something useful'
        });
    }

    async init(context) {
        // Subscribe to facts and/or register command handlers.
        // Keep references so shutdown can undo exactly what init did.
        this.#scoreHandler = (agent) => { /* ... */ };
        context.grid.emitter.onAgentScore(this.#scoreHandler);
        return true;
    }

    async shutdown(context) {
        context.grid.emitter.offAgentScore(this.#scoreHandler);
        return true;
    }
}

export default MyPlugin;
```

The contract:
- `init(context)` — acquire resources; return `false` (or throw) to fail startup
- `shutdown(context)` — release everything acquired in `init`
- Errors are isolated: a throwing plugin gets `status: 'error'` and is stopped,
  the server keeps running

## Managing Plugins at Runtime

REST API (see `src/routes/plugins.js`):

```bash
# list plugins and their status
curl http://localhost:8080/api/plugins

# dynamic load + autostart from disk
curl -X POST http://localhost:8080/api/plugins/load \
    -H 'Content-Type: application/json' \
    -d '{"manifestPath": "./src/plugins/examples/leaderboard-plugin.manifest.json", "autoStart": true}'

# stop / start / reload / remove
curl -X POST http://localhost:8080/api/plugins/parcel-spawner/stop
curl -X POST http://localhost:8080/api/plugins/parcel-spawner/start
curl -X POST http://localhost:8080/api/plugins/movement-standard/stop
curl -X DELETE http://localhost:8080/api/plugins/leaderboard-plugin
```

Or programmatically:

```javascript
import { pluginRegistry } from './plugins/runtime.js';
import MovementPlugin from './plugins/builtins/MovementPlugin.js';

const plugin = pluginRegistry.register(new MovementPlugin());
await pluginRegistry.start(plugin.id);

// switch movement scheme at runtime
await pluginRegistry.stop('movement-standard');
await pluginRegistry.start('movement-rotation');   // after registering it
```

## How a Client Move Flows

```
Client
    ↓ socket.emit('move', 'up')
ioServer handleActions
    ↓ validates direction (invalid → penalty + ack(false))
    ↓ commandBus.dispatch('move', { agent, direction, ack })
MovementPlugin (owns 'move')
    ↓ agent.controller.up()  (action mutex, penalties, animation)
    ↓ ack(destination)  or  ack(false)
Client
    ← acknowledgement
```

Pickup and putdown follow the same path but fall back to the direct controller
call when no plugin owns the command, so the game works with zero plugins
beyond movement.
