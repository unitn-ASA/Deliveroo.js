Marco Robol - marco.robol@unitn.it - University of Trento

# Frontend for Deliveroo.js - @unitn-asa/deliveroo-js-webapp

Web client of [Deliveroo.js](../README.md): play from the browser, watch the game in 3D, and administer the server (map editing, levels, game options) when logged in as admin.

Built with Vue 3 (Composition API), Three.js, Tailwind CSS and daisyUI. It talks to the backend through the SDK (`@unitn-asa/deliveroo-js-sdk`) over Socket.io and the REST API.

## Setup

This package is a workspace of the monorepo: install dependencies from the repository root.

```sh
npm install
```

## Development

The frontend needs a running backend. From the repository root:

```sh
npm run dev-all     # backend (port 8080) and frontend with hot reload
```

or `npm run dev` (backend) and `npm run dev-ui` (frontend) in two terminals.

In development the frontend runs on its own Vite port, so it must be told where the backend is. Create `frontend/.env` (git-ignored):

```sh
VITE_SOCKET_IO_HOST = "http://localhost:8080"
```

Without it, the frontend connects to its own origin, which is what happens in production, where the backend serves the built frontend.

## Build

```sh
npm run build       # from this folder
```

The build is written to `dist/`, which the backend serves at `/`.

## Structure

- `src/components/threejs/`: 3D scene and entities (tiles, agents, parcels, crates)
- `src/components/panels/`: game panels (agents, chat, keyboard, missions, tournament, ...)
- `src/components/modals/`: login, levels, settings and game options
- `src/states/`: connection, tokens and keyboard state
- `src/Connection.js`, `src/Grid.js`: socket connection and client-side game state
