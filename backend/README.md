Marco Robol - marco.robol@unitn.it - University of Trento

# Backend for Deliveroo.js - @unitn-asa/deliveroo-js-backend

Game server of [Deliveroo.js](../README.md): Node.js, Express and Socket.io. It runs the game world, streams it to clients over Socket.io, exposes a REST API, and serves the web client and the documentation.

## Commands

Install dependencies from the repository root (`npm install`), then from this folder:

| Command | Description |
| --- | --- |
| `npm start` | Start the server |
| `npm run dev` | Start with automatic restart on changes (nodemon, `.env` loaded, inspector enabled) |
| `npm run build` | Generate `swagger.json` and `.git-revision` |
| `npm test` | End-to-end tests (`tests/e2e/`) |
| `npm run typecheck` | Type-check the JSDoc-annotated sources |
| `npm run swagger:generate` | Regenerate `swagger.json`, the OpenAPI spec served at `/api-docs` |

The server must be started from this folder (`npm start` does it), since some paths are resolved from the working directory.

## Configuration

Command-line arguments, passed after `--` (e.g. `npm start -- -p 8081 -g ./my-game.json`), take precedence over environment variables:

| Argument | Environment | Default | Description |
| --- | --- | --- | --- |
| `-p`, `--port` | `PORT` | `8080` | HTTP port |
| `-k`, `--clock` | `CLOCK` | `50` | Clock period in ms (50 = 20 frames/s) |
| `-g`, `--game` | | | Path to a game file |
| | `GAME_NAME` | | Name of a game from `@unitn-asa/deliveroo-js-assets` (`assets/games/`) |
| | `GAME` | | Game configuration as inline JSON |
| `-t`, `--timeout` | `AGENT_TIMEOUT` | `10000` | Agent timeout in ms |
| `--broadcast-logs` | `BROADCAST_LOGS` | `false` | Broadcast server logs to all clients |
| | `ADMIN_PASSWORD` | `admin` | Password that grants an admin token |
| | `SUPER_SECRET` | `default_token_private_key` | Key used to sign tokens |

Set `ADMIN_PASSWORD` and `SUPER_SECRET` on any public deployment. Game files define the map, parcels, NPCs, player options, plugins and missions: see the typedefs in `@unitn-asa/deliveroo-js-sdk/types/IOGameOptions.js` and the examples in the assets package.

## Served paths

| Path | Content |
| --- | --- |
| `/` | Web client (`../frontend/dist`) |
| `/api/...` | REST API |
| `/api-docs` | REST API documentation, from `swagger.json` |
| `/docs/`, `/docs/sdk/` | TypeDoc documentation, built with `npm run docs` from the repository root |
| Socket.io | Game state, actions and communication |

## Source layout

| Path | Content |
| --- | --- |
| `index.js` | Entry point: starts the HTTP and Socket.io servers |
| `src/app.js`, `src/routes/` | Express app and REST routes |
| `src/ioServer.js`, `src/ioServer/` | Socket.io layer, see [Socket.io layer](#socketio-layer) |
| `src/core/` | Game world: `Grid`, entities (`Agent`, `Parcel`, `Tile`, `Crate`), spatial layers and registries, `Sensor`, movement rules |
| `src/systems/` | Game systems: map loading, reward decay |
| `src/agentComponents/` | Built-in per-agent components: standard movement, parcel carrier |
| `src/plugins/` | Plugin runtime, built-in and game plugins, see [Plugins](#plugins) |
| `src/npc/` | NPC autopilots (random walk, intelligent collector) |
| `src/config/` | Configuration and command-line arguments |
| `src/middlewares/token.js` | JWT tokens: verification, signing, admin authorization |
| `src/myGrid.js`, `src/myClock.js` | Game grid and clock singletons |
| `scripts/` | Build scripts (OpenAPI spec, git revision) |
| `tests/e2e/` | End-to-end tests |

## Socket.io layer

`src/ioServer.js` creates the server (enhanced with the SDK `DjsServer`) and wires every connection; the modules in `src/ioServer/` each handle one concern.

### Connection flow

1. **Handshake**: the token middleware verifies the `x-token` header, or signs a new token for a `name` query parameter.
2. **Identity**: an `Identity` (id, name, team, role) is built from the token, and the token is sent back with a `token` event.
3. **Shared setup**, for every identity:
   - `broadcast/broadcastConfig.js`: game configuration, on connection and on updates
   - `emitters/emitMapAndTiles.js`: the map, then tile updates
   - `emitters/setupPingPongTracking.js`: latency measurement
   - `handlers/handleCommunications.js`: `say`, `ask`, `shout`, published on the communications hub
   - `handlers/handleClientsLogAndBroadcastToAdmins.js`: client logs forwarded to admins
4. **Role components**: `connectionComponents/attachConnectionComponents.js` maps the role to its components, and is the only place that knows about roles. Adding a role means adding an entry to this map, not a branch in `ioServer.js`:
   - `user` → `PlayerConnectionComponent`: plays as an agent on the map (agent and team rooms, agent creation, sensing, action handlers)
   - `admin` → `AdminConnectionComponent`: map-wide observer without an agent (`admins` room, god sensing), acting through remote control, teleport and admin commands

### Modules

| Folder | Modules |
| --- | --- |
| `connectionComponents/` | `PlayerConnectionComponent`, `AdminConnectionComponent`, `attachConnectionComponents` |
| `handlers/` | `handleActions`: `move` / `pickup` / `putdown` and the generic `action` event, dispatched to the agent command bus. `handleCommunications`, `handleClientsLogAndBroadcastToAdmins` |
| `emitters/` | `emitSensing`: per-agent sensing. `emitGodSensing`: full snapshots for admins, at most once per clock frame. `emitMapAndTiles`, `setupPingPongTracking` |
| `connections/` | `deleteAgentWhenNoConnectionsLeft`: removes the agent after its last socket disconnects, with a grace period for reconnections. `disconnectWhenTooManyWarnings`: kicks agents reaching 1000 warnings |
| `broadcast/` | `broadcastConfig`, `broadcastControllersConnections` (agents connecting and disconnecting), `broadcastMetrics` (performance metrics for admins) |
| `admin/` | `handleAdminCommands` (parcels, crates, tiles, restart, rewards), `handleRemoteControl`, `handleTeleport` |
| `utils/` | `emitNowAndListenToEmitterUntilDisconnect`: emit the current value, follow updates, stop on disconnect |

Each module wires its own cleanup on disconnect (`onDisconnect`, or the `untilDisconnect` utility), so components only start things.

### Communications hub

`src/ioServer/communicationsHub.js` is the server-wide bus between socket messages and server-side components:

- every `say` / `ask` / `shout` is published as a hub `msg` event, so plugins can listen to agents (e.g. missions reading answers); the socket delivery itself is unchanged;
- plugins speak with `communicationsHub.announce()`, and `ioServer.js` broadcasts announcements to all clients as ordinary `msg` events from a server identity (e.g. `mission-master`).

## Plugins

A **plugin** is a global server extension that can be started and stopped at runtime. It receives a `context` in `init()` and acquires what it needs from it:

```javascript
/** @type {import('./PluginBase.js').PluginContext} */
const context = {
    grid,      // the game Grid; grid.emitter broadcasts game-state facts
    commands,  // server CommandBus for server-level commands only
    plugin     // the plugin instance itself
};
```

Runtime behavior that belongs to one agent is implemented as an **agent component**: components are attached to an agent and register commands on that agent's local command bus.

### Integration surfaces

- **Facts** (`grid.emitter`): game-state changes, any number of listeners. Typed subscription methods: `onTile`, `onParcel`, `onCrate`, `onAgentCreated`, `onAgentXy`, `onAgentScore`, `onAgentDeleted`.
- **Server commands** (`context.commands`): global operations registered by plugins, not used for per-agent gameplay actions.
- **Agent commands** (`agent.commands`): per-agent actions such as `up`, `down`, `left`, `right`, `pickup`, `putdown` and plugin commands (e.g. `shoot`). Exactly one component may handle a command on a given agent.

### Layout of `src/plugins/`

- `PluginBase.js`, `PluginRegistry.js`, `runtime.js`: plugin contract, registry and the server's registry instance
- `MovementModePluginBase.js` / `MovementModeComponentBase.js`: base classes of the movement mode plugins (`ghost/`, `push/`, `rotation/`)
- `builtins/`: global plugins shipped with the server, the parcel and NPC spawners
- one folder per game plugin (`energy/`, `keysDoors/`, `doubleDelivery/`, `shooter/`, `missions/`), each with its manifest
- `examples/`: demonstration plugins, loaded on demand

### Agent components

Every agent is created by `Grid.createAgent` with two components:

- `StandardMovementComponent`: claims the four directional commands (`up`, `down`, `left`, `right`) and re-claims them whenever they are freed, so the standard movement is the self-healing default.
- `ParcelCarrierComponent`: handles `pickup` and `putdown`.

Movement modes are driven by the observable `movement_mode` attribute (`'standard' | 'ghost' | 'push' | 'rotation'`), seeded from `config.GAME.player.attributes` or written through the agent REST API:

```bash
curl -X PATCH http://localhost:8080/api/agents/agent-id \
    -H 'Content-Type: application/json' \
    -d '{"attributes":{"movement_mode":"ghost"}}'
```

Each movement mode plugin (`ghost`, `push`, `rotation`, enabled through the game `plugins` list) attaches its component to every agent. The component claims the directional commands while `movement_mode` selects its mode and releases them otherwise, giving them back to the standard movement.

Agent components keep behavior-specific semantics in the component and reuse shared domain functions underneath: `applyMove()` for mutex, acknowledgement and error handling, `core/movement/worldRules.js` for invariant movement physics, and `core/parcelActions.js` for standard pickup and putdown.

### Built-in plugins

Started automatically:

- **`parcel-spawner`** (`ParcelSpawnerPlugin`): spawns parcels on spawner tiles at the configured generation rate (`config.GAME.parcels`). Stopping it cancels the pending schedule; existing parcels keep decaying but are not replaced.
- **`npc-spawner`** (`NPCSpawnerPlugin`): creates and supervises the NPCs of the current game (`config.GAME.npcs`), removing them all on stop and re-applying on configuration changes. Autopilots live in `src/npc/`. It also backs `GET /api/npcs`, which answers 503 while the plugin is stopped.

### Game plugins

Optional plugins adding game mechanics. They are not started automatically: a game enables them in its configuration (or an admin through the REST API):

```json
{
    "plugins": ["energy", "keys-doors", "double-delivery"]
}
```

At boot and on every configuration reload, `myGrid.js` loads each listed plugin from its manifest in `src/plugins/` and starts it. On reload, plugins started by the configuration but no longer listed are stopped, while plugins started by an admin through the REST API are left alone. The `gamekit_test` game in the assets package is a full example.

The configuration is the single source of truth: nothing is loaded on top of it. The backend warns, without blocking, when the game lists a plugin id that no manifest provides (listing the available ids), and when the seeded `player.attributes.movement_mode` has no provider plugin configured or running, since agents would then fall back to the standard movement. Both checks re-run on every configuration reload, and an admin-started plugin silences the `movement_mode` warning for its mode.

Game plugins keep their per-agent state in `agent.attributes` (e.g. energy, keys). Attribute changes trigger sensing updates, like position and score changes.

| Plugin | Description |
| --- | --- |
| `energy` | `energy` attribute (in `sensing.self.attributes`), batteries on `'6'` tiles (`battery` in `sensing.entities`), action costs and passive recharge (`config.GAME.energy`), enforced through the action hook pipeline |
| `keys-doors` | Keys on `'8'` tiles as an infinite source (`key` attribute), doors on `'7'` tiles (`door` in `sensing.entities`); crossing a door consumes one key |
| `double-delivery` | Parcels delivered on `'9'` tiles score twice their reward |
| `shooter` | `shoot` command: a laser along the agent's facing, the first agent in line loses one point |
| `ghost`, `push`, `rotation` | Movement modes, see [Agent components](#agent-components) |
| `missions` | Scripted missions, see below |

### Missions

The `missions` plugin loads the mission script of the current game (`config.GAME.missions`) into one internal instance per descriptor. The loader only creates and disposes them: each mission subscribes itself to the action hooks, the communications hub and the `tournament:round_started` grid event. The `mission-master` identity announces prompts and awards in chat. A game configuration change (tournament map rotation, or a level loaded live by an admin) disposes the previous missions and creates the new ones; a game without a `missions` field has no missions.

- Mission types: `goto`, `deliverAt`, `deliverExactlyNParcels`, `deliverLessValueThan`, `onePickupAnotherDeliver`, `questionAnswer`, `redLightGreenLight`.
- Common fields: `prompt`, `bonus` (negative for penalties), `unatantum` (default true: claimable once per agent), `announce` (default true), `startAfter` (seconds, default 0). Each type adds its own fields (`coordinates`, `requireDelivery`, `parcels`, `threshold`, `question` / `answers`, `greenMs` / `yellowMs` / `redMs` / `rounds`).
- Each mission waits for its `startAfter` delay, counted from map load: until then it is listed but inactive, no game fact reaches it and nothing can be claimed.
- Invalid entries are reported and skipped: a broken mission never prevents the game from starting.
- Secrecy: the script never reaches non-admin agents (it is stripped from the configuration they receive). Admins see every mission, including those waiting for their start, through `GET /api/missions`; agents only get the announced prompts.

### Example plugins

- **`leaderboard-plugin`** (`LeaderboardPlugin`): subscribes to `grid.emitter.onAgentScore` and maintains a sorted leaderboard, exposed through the plugin status (`GET /api/plugins/leaderboard-plugin/status`).

### Writing a plugin

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
        this.scoreHandler = (agent) => { /* ... */ };
        context.grid.emitter.onAgentScore(this.scoreHandler);
        return true;
    }

    async shutdown(context) {
        context.grid.emitter.offAgentScore(this.scoreHandler);
        return true;
    }
}

export default MyPlugin;
```

- `init(context)` acquires resources, and returns `false` or throws to fail startup.
- `shutdown(context)` releases everything acquired in `init`.
- Errors are isolated: a throwing plugin gets `status: 'error'`, and the server keeps running.

### Managing plugins at runtime

REST API, see `src/routes/plugins.js`. Listing is public; loading, starting, stopping, reloading and removing require an admin token in the `x-token` header:

```bash
# list plugins and their status
curl http://localhost:8080/api/plugins

# load from disk and start
curl -X POST http://localhost:8080/api/plugins/load \
    -H 'x-token: ADMIN_TOKEN' -H 'Content-Type: application/json' \
    -d '{"manifestPath":"./src/plugins/examples/leaderboard-plugin.manifest.json","autoStart":true}'

# stop / start / remove
curl -X POST -H 'x-token: ADMIN_TOKEN' http://localhost:8080/api/plugins/parcel-spawner/stop
curl -X POST -H 'x-token: ADMIN_TOKEN' http://localhost:8080/api/plugins/parcel-spawner/start
curl -X DELETE -H 'x-token: ADMIN_TOKEN' http://localhost:8080/api/plugins/leaderboard-plugin
```

## How a client move flows

```text
Client
    ↓ socket.emit('move', 'up')   (or the generic 'action' event)
ioServer handleActions
    ↓ validates direction (invalid -> warning + ack(false))
    ↓ agent.commands.dispatch('up', { ack })
Movement component holding the 'up' command
    ↓ applyMove: acquire action mutex, isolate errors, ack once
    ↓ component move semantics -> shared world rules
    ↓ ack(destination) or ack(false)
Client
    ← acknowledgement
```

Pickup and putdown follow the same path through `ParcelCarrierComponent`. The generic `action` event dispatches any command, plugin ones included, and acknowledges with the `{ success, result | error }` envelope.

## License

[ISC](../LICENSE.md) © Marco Robol, University of Trento
