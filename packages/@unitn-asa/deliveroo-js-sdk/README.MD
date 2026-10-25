# @unitn-asa/deliveroo-js-sdk

SDK for [Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js): connect autonomous agents to a game server, call its REST API, and use the JSDoc types of the game entities.

Full reference: [deliveroojs.azurewebsites.net/docs/sdk/](https://deliveroojs.azurewebsites.net/docs/sdk/), also served at `/docs/sdk/` by every Deliveroo.js server.

## Installation

```bash
npm install @unitn-asa/deliveroo-js-sdk
```

The package is ESM only. It has `socket.io-client` (and, for the server helpers, `socket.io`) as peer dependencies.

## Entry points

| Import | Content |
| --- | --- |
| `@unitn-asa/deliveroo-js-sdk` or `@unitn-asa/deliveroo-js-sdk/client` | `DjsConnect`, `DjsClientSocket`, `DjsRestClient` |
| `@unitn-asa/deliveroo-js-sdk/server` | `DjsServer`, `DjsServerSocket`, the typed Socket.io server used by the backend |
| `@unitn-asa/deliveroo-js-sdk/types/*.js` | JSDoc typedefs (`IOAgent`, `IOParcel`, `IOSensing`, `IOGameOptions`, ...) |

## Connect an agent

```js
import { DjsConnect } from '@unitn-asa/deliveroo-js-sdk';

// DjsConnect( host, token, name, autoconnect = true )
// host, token and name default to the HOST, TOKEN and NAME environment variables
const socket = DjsConnect( 'http://localhost:8080', 'YOUR_TOKEN' );

// Promises resolved by the first matching server event
const me = await socket.me;           // the agent itself
const config = await socket.config;   // game configuration
const { width, height, tiles } = await socket.map;

// Events
socket.onSensing( ( { agents, parcels, crates, self } ) => { /* ... */ } );
socket.onMsg( ( id, name, msg, reply ) => { /* reply is set for emitAsk */ } );

// Actions, resolved with the server acknowledgement
await socket.emitMove( 'up' );        // 'up' | 'down' | 'left' | 'right', resolves to {x, y} or false
await socket.emitPickup();            // picked up parcels
await socket.emitPutdown();           // all carried parcels, or emitPutdown( [ids] )
await socket.emitAction( 'shoot' );   // any command, plugin ones included; throws on failure

// Communication
await socket.emitSay( agentId, 'hello' );
const answer = await socket.emitAsk( agentId, 'question' );
await socket.emitShout( 'hello everyone' );
```

To get a token, pass an empty token and a name: the server creates a new agent and sends its token, available as `await socket.token`. Tokens can also be created from the login panel of the web client, or with `DjsRestClient.getToken()`.

Other events: `onConnect`, `onDisconnect`, `onConfig`, `onMap`, `onTile`, `onAgentConnected`, `onInfo`, `onLog`.

## REST API client

```js
import { DjsRestClient } from '@unitn-asa/deliveroo-js-sdk';

const api = new DjsRestClient( 'http://localhost:8080' );

const { token } = await api.getToken( 'MyAgent', 'MyTeam' );
const config = await api.getConfig( token );
const agents = await api.getAll( 'agents', token );
```

The REST API is documented at `/api-docs` on every server.

## Types

Import the typedefs in JSDoc for editor hints and type checking:

```js
/** @typedef { import('@unitn-asa/deliveroo-js-sdk/types/IOAgent.js').IOAgent } IOAgent */
/** @typedef { import('@unitn-asa/deliveroo-js-sdk/types/IOSensing.js').IOSensing } IOSensing */
```

## Development

From this package folder:

```bash
npm test        # run the tests
npm run docs    # build the SDK documentation site
```

## License

[ISC](LICENSE.md) © Marco Robol, University of Trento

---
_Maintainer: Marco Robol <marco.robol@unitn.it>_
