# Games vs Levels - Migration Summary

## Overview

We've introduced a new **games** system that uses JSON files with a structured, nested format. This is an evolution from the older **levels** system (JS files with flat configuration).

## Key Differences

### Levels (Legacy - JS Files)

**Location:** `resources/levels/*.js`

**Format:** Flat key-value pairs
```javascript
export default {
    MAP_FILE: 'default_map',
    PARCELS_GENERATION_INTERVAL: '2s',
    PARCELS_MAX: 5,
    RANDOMLY_MOVING_AGENTS: 0
}
```

**Status:** Still supported for backwards compatibility

### Games (New - JSON Files)

**Location:** `resources/games/*.json`

**Format:** Nested, structured configuration
```json
{
    "title": "Tournament",
    "description": "Balanced competitive gameplay",
    "maxPlayers": 10,
    "map": {
        "file": "default_map"
    },
    "npcs": [
        { "type": "random", "count": 5, "speed": "2s" },
        { "type": "collector", "count": 2, "speed": "1s", "capacity": 5 }
    ],
    "parcels": {
        "generationInterval": "2s",
        "max": 10,
        "reward": { "avg": 40, "variance": 15 }
    },
    "player": {
        "observation": { "agents": 5, "parcels": 5 }
    },
    "clock": 50
}
```

**Status:** New recommended format

## Advantages of Games Format

### 1. **Structured Organization**
Related settings are grouped together:
- `map` - All map-related settings
- `npcs` - All NPC configurations
- `parcels` - All parcel settings
- `player` - All player/agent settings

### 2. **Multiple NPC Types**
Can configure different NPC behaviors:
```json
"npcs": [
    { "type": "random", "count": 5, "speed": "2s" },
    { "type": "bombs", "spawnRate": "10s", "countdown": "5s" },
    { "type": "ghost", "count": 2, "speed": "3s" },
    { "type": "collector", "count": 3, "speed": "1s", "capacity": 5 }
]
```

### 3. **Procedural Map Generation**
Supports dynamic map generation:
```json
"map": {
    "generation": {
        "width": 40,
        "height": 40,
        "algorithm": "cellular",
        "tileset": ["floor", "wall"],
        "parameters": {
            "wallRatio": 0.45,
            "smoothness": 4
        }
    }
}
```

### 4. **Better Metadata**
Games include titles and descriptions:
```json
{
    "title": "Chaos Mode",
    "description": "Maximum chaos with bombs and many NPCs",
    "maxPlayers": 8
}
```

### 5. **JSON Format Benefits**
- Easier to parse and validate
- Can be edited by non-programmers
- Better tooling support
- Linter/formatter friendly

## Migration Path

### Current State
- ✅ **games/** directory created with examples
- ✅ **src/games.js** with loading utilities
- ✅ **gameToLegacyConfig()** converts games → old config format
- ✅ CLI supports games commands
- ✅ **levels/** still works (backwards compatibility)

### Next Steps (To Be Implemented)

1. **Update backend config.js**
   - Try loading as game first
   - Fall back to level if game not found
   - Use `loadGameAsConfig()` for conversion

2. **Create NPC Spawner Factory**
   ```javascript
   // src/npcs/factory.js
   export function createNPC(type, options) {
       switch (type) {
           case 'random': return new RandomNPC(options);
           case 'bombs': return new BombNPC(options);
           case 'ghost': return new GhostNPC(options);
           case 'collector': return new CollectorNPC(options);
       }
   }
   ```

3. **Create Map Generator**
   ```javascript
   // src/maps/generator.js
   export function generateMap(config) {
       switch (config.algorithm) {
           case 'cellular': return generateCellular(config);
           case 'perlin': return generatePerlin(config);
           case 'random': return generateRandom(config);
       }
   }
   ```

4. **Update frontend**
   - Add games selector UI
   - Show game details when selecting
   - Display NPC types and their properties

5. **Migrate existing levels**
   - Convert `level_1.js` → `basic.json`
   - Convert `fast_frenzy.js` → `fast_frenzy.json`
   - Keep levels/ for backwards compatibility

## File Structure

```
resources/
├── maps/              # Fixed map JSONs
│   ├── default_map.json
│   └── ...
├── games/             # NEW: Game configurations (JSON)
│   ├── basic.json
│   ├── tournament.json
│   ├── chaos.json
│   ├── procedural_caves.json
│   └── ...
└── levels/            # Legacy: Level configurations (JS)
    ├── level_1.js
    ├── fast_frenzy.js
    ├── tactical.js
    ├── competition.js
    └── ...
```

## Available Games

| Game | Description | NPCs | Style |
|------|-------------|------|-------|
| `basic` | Basic gameplay | Random only | Balanced |
| `tournament` | Competitive setting | Random + Collector | Standard |
| `chaos` | Maximum chaos | Random + Bombs + Collector | Fast |
| `procedural_caves` | Unique maps each game | Ghosts | Strategic |

## CLI Commands

```bash
# List games
deliveroojs-assets games

# Show game details
deliveroojs-assets game tournament

# Interactive mode (includes games)
deliveroojs-assets interactive
```

## Usage in Code

```javascript
import { getGamesList, loadGame, loadGameAsConfig } from '@unitn-asa/deliveroo-js-assets';

// Get all games
const games = getGamesList();

// Load game configuration
const gameConfig = loadGame('tournament');

// Convert to legacy format (for backwards compatibility)
const legacyConfig = await loadGameAsConfig('tournament');
```

## Timeline

- ✅ **Phase 1:** Create games schema and utilities
- ✅ **Phase 2:** Create example game configurations
- ✅ **Phase 3:** Add CLI support for games
- 🔄 **Phase 4:** Update backend to use games (TODO)
- 📋 **Phase 5:** Implement NPC spawner factory (TODO)
- 📋 **Phase 6:** Implement map generator (TODO)
- 📋 **Phase 7:** Update frontend (TODO)
- 📋 **Phase 8:** Migrate all levels to games (TODO)
