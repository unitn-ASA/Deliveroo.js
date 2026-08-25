# @unitn-asa/deliveroo-js-sdk

Shared SDK utilities and types for Deliveroo.js (client & server integration helpers).

This package exposes small helpers for interacting with the Deliveroo.js backend (HTTP API helpers, socket helpers and shared JSDoc typedefs) so frontend and other packages can import them from a single entry point.

## Key features

- **HTTP API Clients**: REST clients for game entities
- **Socket Helpers**: Socket-related helpers and types for Deliveroo.js
- **Type Definitions**: JSDoc typedefs that can be used by editors/TypeScript for type hints

## Installation

This package is part of the monorepo and is consumed via file: references in the workspace. If you publish it standalone, install normally with npm/yarn.

From the monorepo root (already linked via workspace):

```bash
# frontend or other package: npm install ../packages/@unitn-asa/deliveroo-js-sdk
```

## Usage (ESM)

Import the functions and types you need from the package root:

```js
import {
    DjsRestClient,
    DjsClientSocket,
    DjsConnect
} from '@unitn-asa/deliveroo-js-sdk/client';
```

### Game API Client

```js
import { DjsRestClient } from '@unitn-asa/deliveroo-js-sdk/client';

const api = new DjsRestClient('http://localhost:8080');

// Get authentication token
const { token } = await api.getToken('MyAgent', 'MyTeam');

// Get game configuration
const config = await api.getConfig(token);

// List agents
const agents = await api.getAll('agents', token);
```

### Socket.IO Client

```js
import { DjsConnect } from '@unitn-asa/deliveroo-js-sdk/client';

// Connect to game server
const socket = await DjsConnect('http://localhost:8080', {
    id: 'agent-1',
    name: 'My Agent',
    team: 'MyTeam'
});

// Listen to events
socket.on('sensing', (data) => {
    console.log('Sensing:', data);
});

// Send actions
socket.emit('move', 'up', (result) => {
    console.log('Move result:', result);
});
```

## Types

The package contains JSDoc typedef files describing `IOAgent`, `IOParcel`, `IOConfig`, `IOGameOptions` and other structures used across the project. When authoring code that consumes this SDK you can import the types in JSDoc.

Example JSDoc import:

```js
/** @typedef {import('@unitn-asa/deliveroo-js-sdk/types/IOAgent.js').IOAgent} IOAgent */
```

## License

ISC

---
_Maintainer: Marco Robol <marco.robol@unitn.it>_
