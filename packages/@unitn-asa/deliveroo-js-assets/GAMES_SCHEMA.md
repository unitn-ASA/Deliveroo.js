# Deliveroo.js Game Configuration Schema

## Overview

Game configurations (`.json` files in `assets/games/`) define complete game setups including:
- Map selection or generation
- NPC spawning configurations
- Parcel spawning settings
- Player/agent settings
- Game clock and timing

## Schema Structure

```json
{
    "title": "Game Title",
    "description": "Game description",
    "maxPlayers": 4,

    "map": {
        "file": "map_name",
        "OR": {
            "generation": {
                "width": 30,
                "height": 30,
                "tileset": ["grass", "water", "mountain"],
                "algorithm": "perlin|cellular|random"
            }
        }
    },

    "npcs": [
        {
            "type": "random|bombs|ghost|collector",
            "count": 5,
            "speed": "2s",
            "properties": {}
        }
    ],

    "parcels": {
        "generationInterval": "2s",
        "max": 5,
        "reward": {
            "avg": 30,
            "varance": 10
        },
        "decadingInterval": "1s"
    },

    "player": {
        "movement": {
            "steps": 1,
            "duration": 50
        },
        "observation": {
            "agents": 5,
            "parcels": 5
        },
        "timeout": 10000
    },

    "clock": 50,
    "penalty": 1,
    "plugins": []
}
```

## Configuration Options

### Map Settings

#### Using a Fixed Map
```json
"map": {
    "file": "default_map"
}
```

#### Procedural Generation
```json
"map": {
    "generation": {
        "width": 30,
        "height": 30,
        "algorithm": "cellular",  // cellular, perlin, random
        "tileset": ["grass", "water", "mountain"],
        "parameters": {
            "smoothness": 0.5,
            "seed": 12345
        }
    }
}
```

### NPC Types

| Type | Description | Properties |
|------|-------------|------------|
| `random` | Standard random movement | speed, count |
| `bombs` | Leaves bombs that explode | countdown, spawnRate, radius |
| `ghost` | Moves through walls | speed, count |
| `collector` | Actively collects parcels | speed, count |
| `chaser` | Chases nearest agent | speed, detectionRange |

#### NPC Configuration Examples

```json
"npcs": [
    {
        "type": "random",
        "count": 5,
        "speed": "2s"
    },
    {
        "type": "bombs",
        "spawnRate": "10s",
        "countdown": "5s",
        "radius": 3
    },
    {
        "type": "collector",
        "count": 2,
        "speed": "1s"
    }
]
```

### Parcel Settings

```json
"parcels": {
    "generationInterval": "2s",     // How often new parcels spawn
    "max": 5,                        // Maximum parcels on grid
    "reward": {
        "avg": 30,                   // Average reward
        "variance": 10,              // Reward variance
        "scaling": "linear|exponential"  // How rewards scale
    },
    "decayingInterval": "1s",       // How fast parcels decay
    "spawnLocations": []             // Specific spawn tiles (optional)
}
```

### Player Settings

```json
"player": {
    "movement": {
        "steps": 1,                  // Tiles per movement
        "duration": 50               // Movement duration (ms)
    },
    "observation": {
        "agents": 5,                 // Agent vision range
        "parcels": 5                 // Parcel visibility range
    },
    "timeout": 10000,               // Action timeout (ms)
    "initialScore": 0,              // Starting score
    "penaltyMultiplier": 1.0        // Penalty multiplier
}
```

### Clock & Timing

```json
"clock": 50,                        // Game clock interval (ms)
"timeLimit": null,                  // Optional time limit in seconds
"rounds": null                      // Optional number of rounds
```

### Plugins

```json
"plugins": [
    "pathfinding",
    "leaderboard",
    "spectator"
]
```

## Example Game Configurations

### Basic Game
```json
{
    "title": "Basic",
    "maxPlayers": 4,
    "map": { "file": "default_map" },
    "npcs": [{ "type": "random", "count": 0 }],
    "parcels": {
        "generationInterval": "2s",
        "max": 5,
        "reward": { "avg": 30, "variance": 10 },
        "decadingInterval": "1s"
    },
    "player": {
        "movement": { "steps": 1, "duration": 50 },
        "observation": { "agents": 5, "parcels": 5 }
    },
    "clock": 50
}
```

### Competition
```json
{
    "title": "Competition",
    "maxPlayers": 10,
    "map": { "file": "default_map" },
    "npcs": [
        { "type": "random", "count": 5, "speed": "2s" },
        { "type": "collector", "count": 3, "speed": "1s" }
    ],
    "parcels": {
        "generationInterval": "1s",
        "max": 15,
        "reward": { "avg": 50, "variance": 20 },
        "decadingInterval": "2s"
    },
    "player": {
        "movement": { "steps": 1, "duration": 50 },
        "observation": { "agents": 5, "parcels": 5 }
    },
    "clock": 50,
    "plugins": ["leaderboard"]
}
```

### Procedural Dungeon
```json
{
    "title": "Dungeon Crawler",
    "maxPlayers": 4,
    "map": {
        "generation": {
            "width": 40,
            "height": 40,
            "algorithm": "cellular",
            "tileset": ["floor", "wall", "door", "chest"],
            "parameters": {
                "wallRatio": 0.4,
                "smoothness": 4
            }
        }
    },
    "npcs": [
        { "type": "ghost", "count": 10, "speed": "3s" },
        { "type": "bombs", "spawnRate": "15s", "countdown": "3s" }
    ],
    "parcels": {
        "generationInterval": "5s",
        "max": 3,
        "reward": { "avg": 100, "variance": 50 },
        "decadingInterval": "30s"
    },
    "player": {
        "movement": { "steps": 1, "duration": 100 },
        "observation": { "agents": 8, "parcels": 8 }
    },
    "clock": 100
}
```

## Migration from JS Levels

### Before (JS format)
```javascript
export default {
    MAP_FILE: 'default_map',
    PARCELS_GENERATION_INTERVAL: '2s',
    PARCELS_MAX: 5,
    RANDOMLY_MOVING_AGENTS: 0
}
```

### After (JSON format)
```json
{
    "title": "Basic",
    "map": { "file": "default_map" },
    "parcels": {
        "generationInterval": "2s",
        "max": 5
    },
    "npcs": [
        { "type": "random", "count": 0 }
    ]
}
```

## Map Generation Algorithms

### Cellular Automata
Good for: Caves, dungeons, organic structures
```json
"algorithm": "cellular",
"parameters": {
    "wallRatio": 0.45,
    "smoothness": 4
}
```

### Perlin Noise
Good for: Terrain, natural-looking maps
```json
"algorithm": "perlin",
"parameters": {
    "scale": 0.1,
    "threshold": 0.5
}
```

### Random
Good for: Completely random maps
```json
"algorithm": "random",
"parameters": {
    "walkableRatio": 0.7
}
```

## Implementation Plan

1. **Create `src/games.js`** - Game loading utilities
2. **Update config.js** - Load from games instead of levels
3. **Create NPC spawner factory** - Different NPC behaviors
4. **Create map generator** - Procedural generation
5. **Migrate existing levels** - Convert JS to JSON
6. **Deprecate levels/** - Keep for backwards compatibility
