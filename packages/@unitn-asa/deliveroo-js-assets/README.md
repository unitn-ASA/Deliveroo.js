# @unitn-asa/deliveroo-js-assets

Game assets (maps, levels) and content API for Deliveroo.js.

## Installation

```bash
npm install @unitn-asa/deliveroo-js-assets
```

## Usage

### Loading Maps

```javascript
import { getMapList, loadMap } from '@unitn-asa/deliveroo-js-assets';

// Get list of available maps
const maps = getMapList();
console.log(maps); // ['default_map', 'map_20', ...]

// Load a specific map (returns tiles array)
const mapData = loadMap('default_map');
```

### Loading Levels

```javascript
import { getLevelsList, loadLevel } from '@unitn-asa/deliveroo-js-assets';

// Get list of available levels
const levels = getLevelsList();
console.log(levels); // ['level_1', 'level_2', ...]

// Load a specific level (returns configuration object)
const levelConfig = await loadLevel('level_1');
```

### Using Content Routes

```javascript
import { contentRoutes } from '@unitn-asa/deliveroo-js-assets';
import express from 'express';

const app = express();

// Mount content routes
app.use('/api/content/maps', contentRoutes.maps);
app.use('/api/content/levels', contentRoutes.levels);
```

## Level Configuration

Levels are JavaScript files that export configuration objects. When a level is loaded, all its configuration values are applied to the game server.

### Configuration Options

```javascript
export default {
    
    MAP_FILE: 'default_map',
    CLOCK: 50,                           // Game clock interval in ms (lower = faster)
    PENALTY: 1,                          // Penalty points for invalid actions
    BROADCAST_LOGS: false                // Broadcast logs to all clients

    // Parcels Configuration
    PARCELS_GENERATION_INTERVAL: '2s',  // How often new parcels spawn: '1s', '2s', '5s', '10s'
    PARCELS_MAX: 5,                      // Maximum number of parcels on the grid
    PARCEL_REWARD_AVG: 30,               // Average reward for parcels
    PARCEL_REWARD_VARIANCE: 10,          // Variance in parcel rewards
    PARCEL_DECADING_INTERVAL: '1s',     // How fast parcels decay: '1s', '2s', '5s', '10s', 'infinite'

    // Player Configuration
    MOVEMENT_DURATION: 50,               // Duration of each movement in ms
    AGENT_TIMEOUT: 10000,                // Timeout for agent actions in ms
    OBSERVATION_DISTANCE: 5,             // How far agents can see, -1 for unlimited
    AGENT_TYPE: 'DefaultAgent',          // Agent class to use

    // NPC Configuration
    RANDOMLY_MOVING_AGENTS: 0,           // Number of random NPCs to spawn
    RANDOM_AGENT_SPEED: '2s',            // Speed of NPCs: '1s', '2s', '5s', '10s'

}
```

### Creating a Custom Level

Create a new `.js` file in the `assets/levels/` directory:

```javascript
// my_custom_level.js
export default {
    name: 'My Custom Level',
    description: 'A challenging level with fast gameplay',

    MAP_FILE: 'default_map',

    // Fast-paced gameplay
    PARCELS_GENERATION_INTERVAL: '1s',
    PARCEL_DECADING_INTERVAL: '1s',
    CLOCK: 40,

    // More parcels
    PARCELS_MAX: 10,
    PARCEL_REWARD_AVG: 50,

    // Some NPCs for competition
    RANDOMLY_MOVING_AGENTS: 3,
    RANDOM_AGENT_SPEED: '1s'
}
```

Then load it:
```bash
# Using CLI
deliveroojs-assets level my_custom_level

# Or in backend
node index.js --level my_custom_level
```

### Default Values

If a configuration option is not specified in a level file, the default value from `config.js` is used. See the default values in the backend configuration file.

## CLI Tool

The package includes a CLI tool for browsing assets:

```bash
# List all maps
deliveroojs-assets maps

# Show map details
deliveroojs-assets map default_map

# Preview map as ASCII art
deliveroojs-assets preview default_map

# List all levels
deliveroojs-assets levels

# Show level details
deliveroojs-assets level level_1

# Interactive mode
deliveroojs-assets interactive
```

## API Endpoints

When mounted, the following endpoints are available:

### Maps
- `GET /api/content/maps` - List all maps
- `GET /api/content/maps/:name` - Get map details
- `GET /api/content/maps/:name.png` - Get map preview image
- `POST /api/content/maps` - Upload a new map (requires admin)

### Levels
- `GET /api/content/levels` - List all levels
- `GET /api/content/levels/:name` - Get level details
- `POST /api/content/levels` - Upload a new level (requires admin)

## File Structure

```
@unitn-asa/deliveroo-js-assets/
├── assets/
│   ├── maps/           # JSON map files
│   │   ├── default_map.json
│   │   └── ...
│   └── levels/         # JS level configuration files
│       ├── level_1.js
│       └── ...
├── src/
│   ├── maps.js        # Map loading functions
│   ├── levels.js      # Level loading functions
│   └── routes/        # Express routes for content API
├── cli.js            # CLI tool
└── index.js          # Main exports
```

## Map Format

Maps are stored in JSON format:

```json
{
  "name": "map_name",
  "description": "Map description",
  "width": 25,
  "height": 25,
  "tiles": [
    [0,1,0,0,2],
    [0,1,0,0,2]
  ]
}
```

### Tile Types

- `0` - Wall
- `1` - Walkable / Spawner
- `2` - Delivery tile
- `3` - Walkable
- `4` - Base
- `5` - Obstacle
- `↑`, `→`, `↓`, `←` - Directional tiles (one-way movement)

## License

ISC
