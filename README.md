Marco Robol - marco.robol@unitn.it - University of Trento

# Deliveroo.js

Deliveroo.js is an **Educational Game**, developed by *Marco Robol* for the course on **Autonomous Software Agents** (ASA) by Prof. *Paolo Giorgini*.
It is a **Grid-Based** parcel collection videogame.
You can play in **Multi-Player** from your browser or develop your own Autonomous Agent that plays in your place.

## How to play

Play online from your browser at [deliveroojs.onrender.com/](https://deliveroojs.onrender.com/) or [https://deliveroojs.azurewebsites.net/](https://deliveroojs.azurewebsites.net/), or preview the latest version at [https://deliveroojsdev.azurewebsites.net/](https://deliveroojsdev.azurewebsites.net/)

`a`: left, `s`: down, `d`: right, `w`: up,
`q`: pickup, `e`: putdown

To run the game locally (requires Node.js 22.x):

1. `npm install`
1. `npm run build`
1. `npm start`

The server listens on [http://localhost:8080](http://localhost:8080) (set the `PORT` environment variable to change it).

On a local instance you can get administration privileges by logging in with the default password `admin`, which gives you a special access token. Click on the map to create or dispose parcels and use numbers `0` through `5` to modify tiles from empty to delivery, walkable, or spawning.

## Documentation

Every server, local or online, serves its own documentation:

| Path | Content |
| --- | --- |
| [`/docs/sdk/`](https://deliveroojs.azurewebsites.net/docs/sdk/) | SDK reference for agent developers |
| [`/api-docs`](https://deliveroojs.azurewebsites.net/api-docs/) | REST API (OpenAPI) |
| [`/docs/`](https://deliveroojs.azurewebsites.net/docs/) | Developer docs of the whole codebase (backend, frontend, SDK, assets) |

## Develop your own autonomous agents

An SDK is available to develop your own agent based on the Deliveroo.js API. Install it with:

`npm install @unitn-asa/deliveroo-js-sdk`

A minimal agent:

```js
import { DjsConnect } from '@unitn-asa/deliveroo-js-sdk';

// Host and token default to the HOST and TOKEN environment variables
const socket = DjsConnect( 'http://localhost:8080', 'YOUR_TOKEN' );

socket.onSensing( ( { agents, parcels, crates } ) => console.log( parcels ) );

await socket.emitMove( 'up' );      // 'up' | 'down' | 'left' | 'right'
await socket.emitPickup();
await socket.emitPutdown();
```

Get a token from the login panel of the web client ("New token"), or connect with a name only (`DjsConnect( host, '', 'my-name' )`) to receive a new one.

Check the examples available at [github.com/unitn-ASA/DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js)

## Game mechanics

### Map and tiles

The map is a grid of tiles, defined in the game configuration as rows of tile codes:

| Code | Tile |
| --- | --- |
| `0` | Wall (not walkable) |
| `1` | Parcel spawner |
| `2` | Delivery |
| `3` | Walkable |
| `4` | Base: walkable, only drawn differently |
| `5` / `5!` | Crate sliding tile / crate sliding tile with a crate at start |
| `6` | Battery spawner (`energy` plugin) |
| `7` | Door (`keys-doors` plugin) |
| `8` | Key spawner (`keys-doors` plugin) |
| `9` | Double delivery (`double-delivery` plugin) |
| `←` `↑` `→` `↓` | One-way tiles: can only be crossed in the arrow direction |

Tiles `6` to `9` only have their effect when their plugin is enabled; otherwise they are plain walkable tiles. In particular, `9` is not a delivery tile by itself.

Each move takes `player.movement_duration` milliseconds, and an agent cannot enter a tile occupied by another agent.

### Sensing

Agents perceive only what is within their `observation_distance` (Manhattan distance; `-1` means unlimited). Each `sensing` event carries the agents, parcels and crates in sight, the sensed tile positions, and `self`, the agent itself with its attributes (e.g. `movement_mode`, `energy`, `warnings`).

### Parcels

Parcels spawn on `1` tiles at every `parcels.generation_event`, up to `parcels.max`, with a random reward around `parcels.reward_avg` (± `reward_variance`). Their reward decreases by 1 at every `parcels.decaying_event`, and a parcel disappears when it reaches 0, even while carried.

`pickup` collects the parcels on the agent's tile, up to the agent's `capacity` (`-1` means unlimited). `putdown` drops all carried parcels, or only the selected ones (`emitPutdown( [ids] )`): on a delivery tile (`2`) their rewards are added to the agent's score and the parcels disappear, elsewhere they are left on the ground.

### Crates

Crates are placed at the start of the game on `5!` tiles and can only move along crate sliding tiles (`5`). Walking into a crate pushes it one tile forward, which is only possible if the next tile is a free crate sliding tile: crates can block corridors and must be moved out of the way.

### Communication

Agents can talk to each other: `emitSay( toId, msg )` sends to one agent, `emitAsk( toId, msg )` waits for a reply, and `emitShout( msg )` broadcasts to everyone. The server also speaks in chat through its own identities, such as `mission-master` for missions.

### Warnings

Invalid actions, such as a move into a wall, increase the agent's `warnings` attribute. An agent reaching 1000 warnings is disconnected.

### Plugins

Each game enables optional mechanics through its `plugins` list:

| Plugin | Effect |
| --- | --- |
| `energy` | Actions cost energy, recharged over time and by batteries collected on `6` tiles |
| `keys-doors` | Keys picked up on `8` tiles open doors on `7` tiles, consuming the key |
| `double-delivery` | Parcels delivered on `9` tiles score twice their reward |
| `shooter` | Adds a `shoot` action: a laser along the agent's facing, the first agent hit loses one point |
| `ghost` | Agents in `ghost` movement mode pass through walls |
| `push` | Agents in `push` movement mode displace blocking agents |
| `rotation` | Agents in `rotation` movement mode turn with `left`/`right` and move forward with `up` |
| `missions` | Scripted missions, announced in chat |

The movement mode is the agent's `movement_mode` attribute, set by the game configuration. Agents discover the actions available to them, plugin ones included, with `GET /api/agents/:id/commands`, and invoke any of them with `emitAction( name )`.

### Missions

When the `missions` plugin is enabled, `mission-master` announces missions in chat: reach a tile, deliver a given number of parcels or on specific tiles, answer a question, stop moving on red light, and more. Completing a mission awards bonus points, while some missions apply penalties. Missions may start after a delay, and the mission script itself is never sent to agents: agents must interpret the announced prompts and answer questions by shouting or saying to `mission-master`.

## Development

| Command | Description |
| --- | --- |
| `npm run dev` | Backend with automatic restart on changes |
| `npm run dev-ui` | Frontend with hot reload |
| `npm run dev-all` | Both |
| `npm run docs` | Build the documentation served at `/docs` and `/docs/sdk` |
| `npm test -w backend` | Backend end-to-end tests |
| `npm test -w @unitn-asa/deliveroo-js-sdk` | SDK tests |

The repository is a monorepo:

- `backend/`: game server (Node.js, Express, Socket.io)
- `frontend/`: web client (Vue 3, Three.js)
- `packages/@unitn-asa/deliveroo-js-sdk`: SDK for agents, published on npm
- `packages/@unitn-asa/deliveroo-js-assets`: game configurations and maps
- `packages/@unitn-asa/deliveroo-js-agents`: example agents

A `Dockerfile` and a `docker-compose.yml` are available for containerized deployments.

## License

[ISC](LICENSE.md) © Marco Robol, University of Trento
