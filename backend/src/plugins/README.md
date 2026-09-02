# Plugins And Components

A **plugin** is a global server extension that can be started and stopped at
runtime. It receives a `context` in `init()` and acquires what it needs from it:

```javascript
/** @type {import('./PluginBase.js').PluginContext} */
const context = {
    grid,      // the game Grid; grid.emitter broadcasts game-state facts
    commands,  // server CommandBus for server-level commands only
    plugin     // the plugin instance itself
};
```

Runtime behavior that belongs to one agent is implemented as an
**AgentComponent**. Components are attached to an agent and register commands on
that agent's local command bus.

## Integration Surfaces

- **Facts** (`grid.emitter`): game-state changes, any number of listeners.
  Typed subscription methods: `onTile`, `onParcel`, `onCrate`, `onAgentCreated`,
  `onAgentXy`, `onAgentScore`, `onAgentDeleted`.
- **Server commands** (`context.commands`): global/server operations registered
  by plugins. These are not used for normal per-agent gameplay actions.
- **Agent commands** (`agent.commands`): per-agent actions such as `move`,
  `pickup`, and `putdown`. Exactly one component may handle a command on a given
  agent.

Directory layout:

- `src/agentComponents/` — the agent component registry singleton
  (`agentComponentRegistry`): factories and presets, no command management.
- `builtins/AgentComponentsPlugin.js` — global provider that registers the
  built-in components and presets into the registry.
- `builtins/agentComponents/` — the built-in per-agent behavior components.
- `builtins/` — global plugins shipped with the server, such as parcel/NPC
  spawners.
- `examples/` — demonstration plugins, loaded on demand.

## Agent Components

The `AgentComponentsPlugin` provider registers these components and presets
into the agent component registry at startup:

- `standard`: `StandardMovementComponent`, `ParcelCarrierComponent`
- `ghost`: `GhostMovementComponent`, `ParcelCarrierComponent`
- `push`: `PushMovementComponent`, `ParcelCarrierComponent`
- `rotation`: `RotationMovementComponent`, `ParcelCarrierComponent`

Dependency direction: the domain (`Grid.createAgent`) only knows the registry
interface; the provider plugin populates it. This also lets other plugins
contribute new components/presets at runtime through the same registry.

New agents receive `config.GAME.player.agent_preset` or `standard` when unset.
Admins can reattach a preset to an existing agent with:

```bash
curl -X PATCH http://localhost:8080/api/agents/agent-id \
    -H 'Content-Type: application/json' \
    -d '{"agentPreset":"ghost"}'
```

Stopping `agent-components` at runtime empties the registry: new agents are
created without command components (their actions acknowledge the safe
fallback), while already-attached agents keep working unchanged.

Agent components should keep behavior-specific semantics in the component and
reuse shared domain functions underneath: `applyMove()` for mutex/ack/error
handling, `movement/worldRules.js` for invariant movement physics, and
`parcelActions.js` for standard pickup/putdown mechanics.

## Connection Components

Role-specific per-socket behavior lives in
`src/ioServer/connectionComponents/`. `attachConnectionComponents(socket,
identity)` resolves the role to a component list and starts each in order;
`ioServer.js` keeps no role branching — the map is the single decision point.

- `user` → `PlayerConnectionComponent` (agent/team rooms, agent creation,
  sensing, `you`/map emits, action handlers)
- `admin` → `AdminConnectionComponent` (`admins` room, identity-only `you`,
  map-wide god sensing, remote control, teleport, admin commands)

Roles select different behaviors: users play as agents on the map; admins
are agent-less observers — no map presence, no own action handlers — acting
on the game through remote control of other agents. Components only start
things — cleanup stays self-wired inside the existing handlers
(`onDisconnect` / `untilDisconnect`). Adding a new role means adding an
entry to the map, not another branch in the connection handler.

## Built-In Global Plugins

### AgentComponentsPlugin (`agent-components`) — auto-started

Populates the agent component registry with the built-in components and
presets. Its start is awaited before the spawners, because `npc-spawner`
creates agents in its own init and `Grid.createAgent` resolves presets from
the registry. Stopping it empties the registry (see Agent Components above).

### ParcelSpawnerPlugin (`parcel-spawner`) — auto-started

Spawns parcels on spawner tiles at the configured generation rate
(`config.GAME.parcels`). Stopping it cancels the pending schedule. Existing
parcels keep decaying but are not replaced; starting it resumes spawning.

### NPCSpawnerPlugin (`npc-spawner`) — auto-started

Creates and supervises the NPCs configured for the current game
(`config.GAME.npcs`), removing them all on stop and re-applying on configuration
changes. NPC behaviors live in `workers/`. Also backs the REST surface
`GET /api/npcs`, which answers 503 while the plugin is stopped.

## Example Plugins

### LeaderboardPlugin (`leaderboard-plugin`)

Consumes facts: subscribes to `grid.emitter.onAgentScore` and maintains a sorted
leaderboard, exposed through the plugin status
(`GET /api/plugins/leaderboard-plugin/status`).

## Writing A Plugin

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

The contract:

- `init(context)` acquires resources and returns `false` or throws to fail startup.
- `shutdown(context)` releases everything acquired in `init`.
- Errors are isolated: a throwing plugin gets `status: 'error'`, and the server keeps running.

## Managing Plugins At Runtime

REST API, see `src/routes/plugins.js`:

```bash
# list plugins and their status
curl http://localhost:8080/api/plugins

# dynamic load + autostart from disk
curl -X POST http://localhost:8080/api/plugins/load \
    -H 'Content-Type: application/json' \
    -d '{"manifestPath":"./src/plugins/examples/leaderboard-plugin.manifest.json","autoStart":true}'

# stop / start / reload / remove
curl -X POST http://localhost:8080/api/plugins/parcel-spawner/stop
curl -X POST http://localhost:8080/api/plugins/parcel-spawner/start
curl -X DELETE http://localhost:8080/api/plugins/leaderboard-plugin
```

## How A Client Move Flows

```text
Client
    ↓ socket.emit('move', 'up')
ioServer handleActions
    ↓ validates direction (invalid -> penalty + ack(false))
    ↓ agent.commands.dispatch('move', { direction, ack })
Agent movement component
    ↓ applyMove: acquire action mutex, isolate errors, ack once
    ↓ component move semantics -> shared world rules
    ↓ ack(destination) or ack(false)
Client
    ← acknowledgement
```

Pickup and putdown follow the same local-agent command path through
`ParcelCarrierComponent`.
