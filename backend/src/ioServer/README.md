# ioServer Architecture - Refactored

## Overview

The `ioServer` module has been **completely refactored** to follow the **Single Responsibility Principle**. What was once a monolithic 800+ line file is now organized into separate, focused modules.

## Architecture

```
backend/src/ioServer/
├── ioServer.js (~100 lines - orchestrator only)
├── namespaces/
│   ├── AdminNamespace.js (~500 lines - admin commands)
│   └── README.md (admin documentation)
└── handlers/
    ├── ConnectionHandler.js (~150 lines - lifecycle management)
    ├── StateBroadcaster.js (~150 lines - state updates)
    ├── CommunicationHandler.js (~100 lines - agent communication)
    └── LogBroadcaster.js (~80 lines - log broadcasting)
```

## Modules

### 1. [ioServer.js](../ioServer.js) - Main Orchestrator (~100 lines)

**Responsibility:** Coordinate all handlers and namespaces

```javascript
class ioServer {
    constructor(socket, agent) {
        setupConnectionHandlers(socket, agent);      // Lifecycle
        setupStateBroadcasting(socket, agent);       // State
        this.setupActionHandlers(socket, agent);     // Actions
        setupCommunicationHandlers(socket, agent);   // Communication
        setupLogBroadcasting(socket, agent);         // Logs
    }

    setupActionHandlers(socket, agent) {
        // Emits events to eventBus for plugin handling
        socket.onMove(...);   // → eventBus.emit('agentMoveRequest')
        socket.onPickup(...); // → eventBus.emit('agentPickupRequest')
        socket.onPutdown(...); // → eventBus.emit('agentPutdownRequest')
    }
}
```

### 2. [namespaces/AdminNamespace.js](./namespaces/AdminNamespace.js) (~500 lines)

**Responsibility:** Admin-only commands via `/admin` namespace

**Features:**
- Separate namespace for admin commands
- JWT authentication + role verification
- Parcel management (create/set/dispose)
- Crate management (create/dispose)
- Tile editing
- Grid restart
- Agent rewards

**Usage:**
```javascript
// Connect to admin namespace
const adminSocket = io('http://localhost:3000/admin', {
    auth: { token: 'ADMIN_JWT_TOKEN' }
});

// Create parcel
adminSocket.emit('parcel', 'create', { x: 10, y: 5, reward: 100 }, (response) => {
    console.log(response); // { success: true, parcel: {...} }
});
```

**See:** [namespaces/README.md](./namespaces/README.md) for complete documentation

### 3. [handlers/ConnectionHandler.js](./handlers/ConnectionHandler.js) (~150 lines)

**Responsibility:** Socket connection lifecycle management

**Features:**
- **Disconnection handling:** Agent deletion timeout on last disconnect
- **Ping/pong tracking:** Latency monitoring every 1 second
- **Admin metrics:** Performance metrics broadcasting for admins
- **Penalty listener:** Auto-kick bad behaving agents

```javascript
export function setupConnectionHandlers(socket, agent) {
    // Disconnect with timeout
    socket.onDisconnect(async (cause) => {
        // ... delete agent if no reconnection
    });

    // Ping/pong latency tracking
    const pingInterval = setInterval(() => {
        socket.emit('ping', {...}, () => {
            // Calculate round-trip time
        });
    }, 1000);

    // Admin metrics (if admin)
    if (agent.identity?.role === 'admin') {
        setInterval(() => socket.emit('metrics', ...), 1000);
    }

    // Penalty-based auto-kick
    agent.emitter.on('penalty', () => {
        if (agent.penalty < -1000) socket.disconnect();
    });
}
```

### 4. [handlers/StateBroadcaster.js](./handlers/StateBroadcaster.js) (~150 lines)

**Responsibility:** Game state broadcasting to clients

**Features:**
- **Config emission:** Send game configuration
- **Map/tiles updates:** Real-time tile changes
- **Agent broadcasting:** Agent connection/disconnection
- **"Me" updates:** Position, score, penalty, parcels
- **Sensing updates:** Agent sensing data

```javascript
export function setupStateBroadcasting(socket, agent) {
    // Emit config
    socket.emitConfig(config);

    // Setup map/tiles broadcasting
    myGrid.emitter.onTile(tileListener);
    socket.emitMap(maxX, maxY, tiles);

    // Setup agent broadcasting
    myGrid.emitter.onAgentCreated(agentCreatedListener);
    myGrid.emitter.onAgentDeleted(agentDeletedListener);

    // Setup "me" updates
    agent.emitter.on('xy', meListener);
    agent.emitter.on('score', meListener);
    agent.emitter.on('penalty', meListener);
    agent.emitter.on('carryingParcels', meListener);

    // Setup sensing updates
    agent.sensor.emitter.on('sensing', sensingListener);
}
```

### 5. [handlers/CommunicationHandler.js](./handlers/CommunicationHandler.js) (~100 lines)

**Responsibility:** Agent-to-agent communication

**Features:**
- **say:** 1-to-1 communication
- **ask:** Request-reply pattern
- **shout:** Broadcast to all agents

```javascript
export function setupCommunicationHandlers(socket, agent) {
    // say - Send message to specific agent
    socket.onSay((toId, msg, callback) => {
        socket.emitMsg(agent, toId, msg);
        callback('successful');
    });

    // ask - Send message and wait for reply
    socket.onAsk(async (toId, msg, callback) => {
        const reply = await socket.emitAsk(agent, toId, msg);
        callback(reply);
    });

    // shout - Broadcast message to all agents
    socket.onShout((msg, callback) => {
        socket.broadcastMsg(agent, msg);
        callback('successful');
    });
}
```

### 6. [handlers/LogBroadcaster.js](./handlers/LogBroadcaster.js) (~80 lines)

**Responsibility:** Client and server log broadcasting

**Features:**
- **Client logs:** Forward client logs to other clients
- **Server logs:** Global log broadcasting (configured via `BROADCAST_LOGS`)

```javascript
export function setupLogBroadcasting(socket, agent) {
    const logListener = (...message) => {
        socket.broadcast.emit('log', {
            socket: socket.id,
            id: agent.id,
            name: agent.name
        }, ...message);
    };

    // Enable/disable based on config
    configEmitter.on('BROADCAST_LOGS', (v) => {
        if (v) socket.on('log', logListener);
        else socket.off('log', logListener);
    });
}
```

## Benefits of Refactoring

### Before
- ❌ **820 lines** in single file
- ❌ All responsibilities mixed together
- ❌ Hard to test individual features
- ❌ Difficult to maintain and debug
- ❌ Admin logic scattered throughout

### After
- ✅ **~100 lines** in main orchestrator
- ✅ Each module has **single responsibility**
- ✅ Easy to test in isolation
- ✅ Simple to maintain and extend
- ✅ Admin namespace completely separated
- ✅ Type-safe with JSDoc documentation

## Testing

Each module can now be tested independently:

```javascript
// Test ConnectionHandler
import { setupConnectionHandlers } from './handlers/ConnectionHandler.js';

describe('ConnectionHandler', () => {
    it('should setup ping/pong tracking', () => {
        const mockSocket = createMockSocket();
        const mockAgent = createMockAgent();
        setupConnectionHandlers(mockSocket, mockAgent);
        // Assert ping interval is set
    });
});
```

## Usage Example

```javascript
// Main connection handler (ioServer.js)
io.on('connection', async (socket) => {
    const agent = myGrid.createAgent(identity);
    
    // All handlers are automatically setup
    new ioServer(DjsServerSocket.enhance(socket), agent);
});
```

## Event Flow

```
Client Connection
    ↓
ioServer constructor
    ├── setupConnectionHandlers()    → Lifecycle management
    ├── setupStateBroadcasting()     → State updates
    ├── setupActionHandlers()        → → eventBus (plugins)
    ├── setupCommunicationHandlers() → Agent communication
    └── setupLogBroadcasting()       → Log forwarding
```

## Future Extensibility

Adding new features is now straightforward:

### Add New Handler

```javascript
// 1. Create new handler
// backend/src/ioServer/handlers/NewFeatureHandler.js
export function setupNewFeature(socket, agent) {
    socket.on('newFeature', (data) => {
        // Handle new feature
    });
}

// 2. Import in ioServer.js
import { setupNewFeature } from './ioServer/handlers/NewFeatureHandler.js';

// 3. Add to constructor
constructor(socket, agent) {
    // ... existing handlers
    setupNewFeature(socket, agent);
}
```

### Add New Namespace

```javascript
// 1. Create namespace
// backend/src/ioServer/namespaces/NewNamespace.js
export function setupNewNamespace(io) {
    const newNamespace = io.of('/new');
    newNamespace.on('connection', (socket) => {
        // Handle connection
    });
}

// 2. Register in ioServer.js
import { setupNewNamespace } from './ioServer/namespaces/NewNamespace.js';
setupNewNamespace(io);
```

## Files Summary

| File | Lines | Responsibility |
|------|-------|----------------|
| [ioServer.js](../ioServer.js) | ~100 | Orchestrator |
| [namespaces/AdminNamespace.js](./namespaces/AdminNamespace.js) | ~500 | Admin commands |
| [handlers/ConnectionHandler.js](./handlers/ConnectionHandler.js) | ~150 | Connection lifecycle |
| [handlers/StateBroadcaster.js](./handlers/StateBroadcaster.js) | ~150 | State broadcasting |
| [handlers/CommunicationHandler.js](./handlers/CommunicationHandler.js) | ~100 | Communication |
| [handlers/LogBroadcaster.js](./handlers/LogBroadcaster.js) | ~80 | Log broadcasting |

## Related Documentation

- [Admin Namespace Usage](./namespaces/README.md)
- [Admin Client Example](./namespaces/AdminClient.example.js)
- [Plugin System](../../plugins/README.md)
- [Event System](../../events/README.md)
