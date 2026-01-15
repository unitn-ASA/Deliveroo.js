# @unitn-asa/deliveroo-js-sdk

Shared SDK utilities and types for Deliveroo.js (client & server integration helpers).

This package exposes small helpers for interacting with the Deliveroo.js backend (HTTP API helpers, socket helpers and shared JSDoc typedefs) so frontend and other packages can import them from a single entry point.

## Key features

- Small HTTP helper functions for the Deliveroo REST API (tokens, configs, agents, parcels).
- Socket-related helpers and types for `Deliveroojs`.
- JSDoc typedefs that can be used by editors/TypeScript for type hints.

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
    DeliveroojsRestClient,
    DeliveroojsAsyncClient
} from '@unitn-asa/deliveroo-js-sdk';
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
