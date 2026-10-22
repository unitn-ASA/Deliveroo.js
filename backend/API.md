# Config API Reference

RESTful API for server and game configuration.

## Endpoints

### Server Configuration

#### `GET /api/config/server`
Get server configuration (infrastructure settings).

**Response:**
```json
{
  "PORT": 8080,
  "CLOCK": 50,
  "AGENT_TIMEOUT": 10000,
  "BROADCAST_LOGS": false,
  "LEVEL": "tournament"
}
```

#### `PATCH /api/config/server` ⚠️ Admin
Update server configuration. Some changes require server restart.

**Body:**
```json
{
  "BROADCAST_LOGS": true,
  "AGENT_TIMEOUT": 15000,
  "CLOCK": 40
}
```

**Updatable fields:** `BROADCAST_LOGS`, `AGENT_TIMEOUT`, `CLOCK`

---

### Game Configuration

#### `GET /api/config/game`
Get current game configuration (gameplay settings).

**Response:**
```json
{
  "title": "Tournament",
  "description": "Standard tournament configuration",
  "map": { "file": "default_map" },
  "npcs": [...],
  "parcels": {...},
  "player": {...}
}
```

#### `GET /api/config/game/available`
List all available games with metadata.

**Response:**
```json
[
  {
    "name": "basic",
    "title": "Basic Game",
    "description": "Basic gameplay settings"
  },
  {
    "name": "tournament",
    "title": "Tournament",
    "description": "Standard tournament configuration"
  }
]
```

#### `POST /api/config/game/load` ⚠️ Admin
Load a specific game configuration.

**Body:**
```json
{ "name": "tournament" }
```

**Response:** Current game configuration

---

### Legacy Endpoints (Deprecated)

| Legacy | New |
|--------|-----|
| `GET /api/configs` | `GET /api/config/server` |
| `PATCH /api/configs` | `PATCH /api/config/server` |

---

## Socket.IO Events

### Client receives:
- `config` - Emitted when configuration changes
  ```javascript
  { server: {...}, game: {...} }
  ```

---

## Error Responses

```json
{
  "error": "Game name is required"
}
```

Status codes:
- `400` - Bad request
- `404` - Game not found
- `500` - Server error

---

## Missions & Tournament API

### `GET /api/missions` ⚠️ Admin
Get every mission of the game script (`config.GAME.missions`), including the
ones still waiting for their `startAfter` timer (listed with `active: false`
and their `startsAt` epoch). The mission script never reaches non-admin agents
through the config broadcast: this is the only surface reading it, admin-only
by design — agents must interpret the announced prompts. Answers `403`
without admin privileges and `503` when the missions plugin is not running.

**Response:**
```json
{
  "missions": [
    {
      "index": 0,
      "type": "goto",
      "prompt": "Reach (4,0)",
      "bonus": 50,
      "unatantum": true,
      "config": { "coordinates": [{ "x": 4, "y": 0 }] },
      "stats": { "awards": 2 }
    }
  ]
}
```
