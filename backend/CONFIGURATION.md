# Deliveroo.js Configuration Guide

## Overview

Deliveroo.js uses a flexible configuration system that allows you to customize gameplay through **level files**. Each level defines its own set of configuration parameters that control game behavior.

## How Configuration Works

1. **Default values** are defined in `config.js`
2. **Level files** in the assets package can override these defaults
3. **Command-line arguments** take highest priority
4. **Environment variables** can also set configuration

## Loading a Level

### Method 1: Command Line

```bash
# Using the --level flag
node index.js --level fast_frenzy

# Using environment variable
LEVEL=tactical node index.js
```

### Method 2: Runtime (via API)

```javascript
// PATCH to /api/configs
{
    "LEVEL": "competition"
}
```

### Method 3: Frontend UI

Use the Levels modal in the web UI to select and load a level.

## Configuration Priority

Settings are applied in this order (later settings override earlier ones):

1. Default values in `config.js`
2. Level file loaded via `process.env.LEVEL`
3. Level file loaded via `--level` argument
4. Individual command-line arguments (e.g., `--parcels-max 10`)
5. Runtime PATCH to `/api/configs`

## Available Configuration Options

### Core Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `PORT` | number | `8080` | Server port |
| `MAP_FILE` | string | `'default_map'` | Map to load (without .json) |
| `CLOCK` | number | `50` | Game clock interval (ms) |
| `PENALTY` | number | `1` | Penalty for invalid actions |
| `BROADCAST_LOGS` | boolean | `false` | Broadcast logs to clients |

### Parcels Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `PARCELS_GENERATION_INTERVAL` | string | `'2s'` | How often parcels spawn |
| `PARCELS_MAX` | number | `5` | Max parcels on grid |
| `PARCEL_REWARD_AVG` | number | `30` | Average parcel reward |
| `PARCEL_REWARD_VARIANCE` | number | `10` | Reward variance |
| `PARCEL_DECADING_INTERVAL` | string | `'1s'` | Parcel decay rate |

### Player Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `MOVEMENT_DURATION` | number | `50` | Movement duration (ms) |
| `AGENT_TIMEOUT` | number | `10000` | Agent action timeout (ms) |
| `OBSERVATION_DISTANCE` | number | `5` | vision range |
| `AGENT_TYPE` | string | `'DefaultAgent'` | Agent class name |

### NPCs Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `RANDOMLY_MOVING_AGENTS` | number | `0` | Number of NPCs |
| `RANDOM_AGENT_SPEED` | string | `'2s'` | NPC movement speed |

## Creating Custom Levels

### Quick Start

1. Copy an existing level file from `packages/@unitn-asa/deliveroo-js-assets/resources/levels/`
2. Modify the configuration values
3. Save with a new name ending in `.js`
4. Load it with `--level your_level_name`

### Example: Creating a "Chaos" Level

```javascript
// chaos.js
export default {
    name: 'Chaos Mode',
    description: 'Maximum chaos!',

    MAP_FILE: 'default_map',

    // Everything fast!
    PARCELS_GENERATION_INTERVAL: '1s',
    PARCEL_DECADING_INTERVAL: '1s',
    CLOCK: 30,

    // Lots of everything
    PARCELS_MAX: 20,
    RANDOMLY_MOVING_AGENTS: 15,

    // Wild rewards
    PARCEL_REWARD_AVG: 50,
    PARCEL_REWARD_VARIANCE: 40,

    // Punish mistakes
    PENALTY: 5
}
```

## Levels Included in Assets Package

| Level | Style | Description |
|-------|-------|-------------|
| `default` | Balanced | Standard gameplay |
| `fast_frenzy` | Fast | Quick spawns, fast decay |
| `tactical` | Slow | Strategic, high rewards |
| `competition` | Competitive | Many NPCs, balanced |

## Tips for Level Design

1. **Balance is key** - Test your level to ensure it's playable
2. **Consider observation distance** - Higher values make the game easier
3. **Parcel count vs NPC count** - More NPCs + fewer parcels = harder
4. **Clock speed** - Lower values = faster gameplay = harder
5. **Penalties** - Use sparingly; high penalties can be frustrating

## Testing Your Level

```bash
# Start server with your level
node index.js --level my_level

# Or use the CLI to preview it first
cd packages/@unitn-asa/deliveroo-js-assets
npm run cli -- level my_level
```
