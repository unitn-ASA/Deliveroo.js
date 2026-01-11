import { args } from './argParser.js';
import { loadGame } from '@unitn-asa/deliveroo-js-assets';
import { readFileSync } from 'fs';

/** @typedef {import('@unitn-asa/deliveroo-js-sdk/src/web-socket/IOClockEvent.js').IOClockEvent} IOClockEvent */
/** @typedef {import('@unitn-asa/deliveroo-js-sdk/src/config/IOGameOptions.js').IOGameOptions} IOGameOptions */
/** @typedef {import('@unitn-asa/deliveroo-js-sdk/src/config/IOGameOptions.js').IONpcsOptions} IONpcsOptions */
/** @typedef {import('@unitn-asa/deliveroo-js-sdk/src/config/IOGameOptions.js').IOParcelsOptions} IOParcelsOptions */
/** @typedef {import('@unitn-asa/deliveroo-js-sdk/src/config/IOGameOptions.js').IOPlayerOptions} IOPlayerOptions */
/** @typedef {import('@unitn-asa/deliveroo-js-sdk/src/config/IOConfig.js').IOConfig} IOConfig */


/**
 * Apply JSON configuration to this instance
 * @param {IOGameOptions} json - Game configuration JSON
 */
export async function loadGameConfig(json) {

    // General configuration
    if (json.title) {
        config.GAME.title = json.title;
    }
    if (json.description) {
        config.GAME.description = json.description;
    }
    if (json.maxPlayers !== undefined) {
        config.GAME.maxPlayers = json.maxPlayers;
    }
    if (json.map?.tiles && Array.isArray(json.map.tiles)) {
        config.GAME.map.tiles = json.map.tiles;
        const { myGrid } = await import('../myGrid.js');
        myGrid.loadMap( json.map.tiles );
    }

    // NPCs configuration
    if (json.npcs && Array.isArray(json.npcs)) {
        config.GAME.npcs = json.npcs;
    }

    // Parcels configuration
    if (json.parcels?.generation_event) {
        config.GAME.parcels.generation_event = json.parcels.generation_event;
    }
    if (json.parcels?.decading_event) {
        config.GAME.parcels.decading_event = json.parcels.decading_event;
    }
    if (json.parcels.max !== undefined) {
        config.GAME.parcels.max ??= json.parcels.max;
    }
    if (json.parcels?.reward_avg !== undefined || json.parcels?.reward_variance !== undefined) {
        config.GAME.parcels.reward_avg = json.parcels.reward_avg;
        config.GAME.parcels.reward_variance = json.parcels.reward_variance;
    }

    // Player configuration
    if (json.player?.movement_duration !== undefined) {
        config.GAME.player.movement_duration = json.player.movement_duration;
    }
    if (json.player?.agents_observation_distance !== undefined) {
        config.GAME.player.agents_observation_distance = json.player.agents_observation_distance;
    }
    if (json.player.parcels_observation_distance !== undefined) {
        config.GAME.player.parcels_observation_distance = json.player.parcels_observation_distance;
    }

}




async function lazyLoading( config ) {

    // Load gameConfig by file as specified in args.GAME_FILE
    if (args.GAME_FILE) {
        try {
            let json = readFileSync(args.GAME_FILE, 'utf-8')
            loadGameConfig(JSON.parse(json));
        } catch (err) {
            console.error('Error loading from args.LEVEL', args.LEVEL);
        }
    }
    // Load gameConfig by name as specified in args.GAME_NAME or process.env.GAME_NAME
    else if (process.env.GAME_NAME) {
        try {
            const json = await loadGame(process.env.GAME_NAME);
            loadGameConfig(json);
        } catch (err) {
            console.error('Error loading from process.env.GAME_NAME', process.env.GAME_NAME);
        }
    }

    // 5. Overwrite config with values specified as args
    if (args.PENALTY !== undefined) {
        config.PENALTY = args.PENALTY;
    }
    if (args.AGENT_TIMEOUT !== undefined) {
        config.AGENT_TIMEOUT = args.AGENT_TIMEOUT;
    }
    if (args.BROADCAST_LOGS !== undefined) {
        config.BROADCAST_LOGS = args.BROADCAST_LOGS;
    }

    console.log("Initial config:", config);
    
}





/** @type {Number} */
export const PORT = args.PORT || Number(process.env.PORT) || 8080;


/** @type {IOConfig} */
export const config = {

    /** @type {Number} */
    CLOCK:          args.CLOCK   || Number(process.env.CLOCK)           || 50,
    
    /** @type {Number} */
    PENALTY:                        Number(process.env.PENALTY)         || 1,
    
    /** @type {Number} */
    AGENT_TIMEOUT:                  Number(process.env.AGENT_TIMEOUT)   || 10000,
    
    /** @type {Boolean} */
    BROADCAST_LOGS:                 Boolean(process.env.BROADCAST_LOGS) || false,
    
    /** @type {IOGameOptions} */
    GAME:                           (process.env.GAME ? JSON.parse(process.env.GAME) : undefined)
                                                                        || {
        title: 'Default Game',
        description: 'Default game configuration',
        maxPlayers: 10,
        map: {
            width: 2,
            height: 2,
            tiles: [
                ['1','1'],
                ['1','1']
            ]
        },
        npcs: [
            {
                moving_event: 'frame',
                type: 'random',
                count: 1,
                capacity: 5
            }
        ],
        parcels: {
            generation_event: '1s',
            decading_event: '1s',
            max: 5,
            reward_avg: 30,
            reward_variance: 10,
        },
        player: {
            agent_type: undefined,
            movement_duration: 50,
            agents_observation_distance: 2,
            parcels_observation_distance: 2,
            capacity: 5,
        },
    }
};



// initialize
await lazyLoading(config);
