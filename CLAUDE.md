# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Deliveroo.js is an educational multi-player grid-based parcel collection game developed for the Autonomous Software Agents (ASA) course at University of Trento. Users can play manually from their browser or develop autonomous agents to play on their behalf.

## Architecture

This is a **monorepo** with three main parts:

- **frontend/** - Vue.js + Three.js web application (client)
- **backend/** - Node.js + Express + Socket.io game server
- **packages/@unitn-asa/** - Shared packages (SDK, assets, example agents)

### Communication Architecture

The game uses **Socket.io** for real-time bidirectional communication between clients and server:

- **Client → Server**: Agent actions (move, pickup, putdown), communication (say, ask, shout)
- **Server → Client**: Game state updates (tiles, agents, parcels), clock events, sensing data
- **JWT authentication**: Admin/god mode for map editing and debugging

### Backend Architecture

The backend follows an **Entity-Component-System** pattern with event-driven state management:

- **Grid System**: Core game world managing tiles, agents, parcels, and crates
- **Spatial Registries**: O(1) lookup by XY coordinates for all entities
- **Event System**: Custom `GridEventEmitter` for efficient state change propagation
- **Game Systems**: `RewardDecayingSystem`, `MapLoadingSystem` for specific game mechanics
- **Workers**: `ParcelSpawner`, `NPCspawner` for autonomous entities

Key files:
- `backend/src/deliveroo/Grid.js` - Central game state and entity management
- `backend/src/deliveroo/Agent.js` - Agent entities with sensor/controller components
- `backend/src/deliveroo/Parcel.js`, `Tile.js`, `Crate.js` - Game entities
- `backend/src/ioServer.js` - Socket.io server with enhanced event handling
- `backend/src/systems/` - Game system implementations
- `backend/src/workers/` - NPC and parcel spawning logic

### Frontend Architecture

The frontend uses **Vue 3 Composition API** with reactive state management:

- **Three.js Integration**: 3D visualization of game world (tiles, agents, parcels)
- **Component Structure**: Modular components for each game entity type
- **State Management**: Reactive connection state with game data
- **Panel System**: UI controls for game interaction

Key files:
- `frontend/src/components/threejs/Deliveroojs.vue` - Main 3D scene wrapper
- `frontend/src/components/threejs/ThreeScene.vue` - Three.js scene setup
- `frontend/src/components/threejs/Agent.vue`, `Parcel.vue`, `Tile.vue` - Entity components
- `frontend/src/states/myConnection.js` - Socket.io connection state

### SDK Package

The `@unitn-asa/deliveroo-js-sdk` package provides:
- **Client API**: `DjsConnect`, `DjsClientSocket` for agent development
- **Server API**: Enhanced Socket.io with `DjsServer`, `DjsServerSocket`
- **Type Definitions**: TypeScript types for all game entities and events
- **REST Client**: `DjsRestClient` for HTTP-based game interaction

## Common Development Commands

### Backend (Node.js + Express)

```bash
cd backend
npm start           # Start production server
npm run dev         # Start development server with nodemon
npm run build       # Build the application
npm run schemas:generate    # Generate JSON schemas
npm run swagger:generate     # Generate API documentation
npm run docs        # Generate documentation
```

### Frontend (Vue.js + Three.js)

```bash
cd frontend
npm run dev         # Start development server with hot reload
npm run build       # Build for production
npm run preview     # Preview production build
npm run docs        # Generate TypeScript documentation
```

### SDK Package

```bash
cd packages/@unitn-asa/deliveroo-js-sdk
npm test            # Run SDK tests
```

## Game Concepts

### Map Structure
- **Grid-based**: 2D tile map with coordinate system
- **Tile Types**: Walkable, delivery tiles, spawning tiles, obstacles
- **JSON Configuration**: Maps loaded from `@unitn-asa/deliveroo-js-assets` or custom JSON files

### Agent System
- **Identity**: Each agent has ID, name, teamId, teamName
- **Position**: XY coordinates on the grid
- **Sensing**: Limited observation distance for nearby entities
- **Actions**: Move (up/down/left/right), pickup, putdown parcels
- **Communication**: say (1-to-1), ask (request-reply), shout (broadcast)

### Parcel System
- **Spawning**: Time-based or event-based parcel generation
- **Rewards**: Decaying reward value over time
- **Delivery**: Points scored by delivering to delivery tiles
- **Capacity**: Agents have limited parcel carrying capacity

### Admin Mode
- Login as `god` for unlimited observation and admin capabilities
- Click map to create/dispose parcels
- Shift+click to modify tile types
- Access performance metrics and system monitoring

## Performance Considerations

The codebase includes performance optimizations:
- **Spatial Registry**: O(1) entity lookups by XY coordinates
- **Event Batching**: State changes batched and emitted at next tick
- **Lazy Sensing**: Sensor computation only when needed
- **Memory Management**: Proper listener cleanup on disconnect
- **Action Mutex**: Prevents concurrent agent actions

## Testing

- **SDK Tests**: `packages/@unitn-asa/deliveroo-js-sdk/tests/`
- **No Framework**: Tests use Node.js built-in functionality
- **Manual Testing**: Use browser client or connect autonomous agents

## Deployment

- **Docker**: `docker-compose.yml` for containerized deployment
- **Cloud**: Azure and Render deployments configured
- **Environment**: Node.js 22.x required

## Agent Development

Develop autonomous agents using the SDK:
- API client available at [github.com/unitn-ASA/DeliverooAgent.js](https://github.com/unitn-ASA/DeliverooAgent.js)
- Example agents in `packages/@unitn-asa/deliveroo-js-agents/`
- Socket.io-based communication with game server
- Sensing API for perceiving nearby entities
- Action API for movement and parcel manipulation
