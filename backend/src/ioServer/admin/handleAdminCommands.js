import { myGrid } from '../../myGrid.js';
import Xy from '../../core/Xy.js';
import { parseIOTileType } from '@unitn-asa/deliveroo-js-sdk/types/IOTile.js';

/**
 * Setup admin command handlers: parcel, crate, tile, restart, reward commands
 * Handles: parcel, crate, tile, restart, reward commands
 *
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Socket instance
 * @param {object} identity - Identity object
 */
export function handleAdminCommands(socket, identity) {

    console.log(`[AdminCommandHandlers] Setting up admin commands for ${identity.name}`);

    /**
     * Parcel management handler
     * Actions: create, set, dispose
     */
    socket.on('parcel', async (action, parcel, ack) => {
        await handleParcelCommand(action, parcel, ack, socket, identity);
    });

    /**
     * Crate management handler
     * Actions: create, dispose
     */
    socket.on('crate', async (action, data, ack) => {
        await handleCrateCommand(action, data, ack, socket, identity);
    });

    /**
     * Tile editing handler
     */
    socket.on('tile', async (t) => {
        await handleTileCommand(t, socket, identity);
    });

    /**
     * Grid restart handler
     */
    socket.on('restart', async () => {
        await handleRestartCommand(socket, identity);
    });

    /**
     * Agent reward handler
     */
    socket.on('reward', async (data) => {
        await handleRewardCommand(data, socket, identity);
    });

    console.log(`✅ [AdminCommandHandlers] Admin commands setup complete for ${identity.name}`);
}

/**
 * Handle parcel management commands
 * @param {string} action - 'create', 'set', 'dispose'
 * @param {Object} parcel - Parcel data
 * @param {Function} ack - Acknowledgment callback
 * @param {import('@unitn-asa/deliveroo-js-sdk/server').DjsServerSocket} socket - Socket instance
 * @param {object} identity - Identity object
 */
async function handleParcelCommand(action, parcel, ack, socket, identity) {
    try {
        // Verify admin role
        if (identity.role != 'admin') {
            console.warn(`[AdminCommandHandlers] Unauthorized parcel command by ${identity.name}`);
            if (ack && typeof ack === 'function') ack({ success: false, error: 'Unauthorized' });
            return;
        }

        // Validate action
        if (typeof action !== 'string') {
            console.warn('Invalid parcel action type');
            if (ack && typeof ack === 'function') ack({ success: false, error: 'Invalid action' });
            return;
        }

        // Validate parcel object
        if (!parcel || typeof parcel !== 'object') {
            console.warn('Invalid parcel data');
            if (ack && typeof ack === 'function') ack({ success: false, error: 'Invalid parcel data' });
            return;
        }

        console.log(`[AdminCommandHandlers] ${identity.name} Parcel ${action}:`, parcel);

        switch (action) {
            case 'create':
                await handleParcelCreate(parcel, ack, socket, identity);
                break;
            case 'set':
                await handleParcelSet(parcel, ack, socket, identity);
                break;
            case 'dispose':
                await handleParcelDispose(parcel, ack, socket, identity);
                break;
            default:
                console.warn(`Unknown parcel action: ${action}`);
                if (ack && typeof ack === 'function') ack({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error in parcel command:', error.message);
        if (ack && typeof ack === 'function') ack({ success: false, error: error.message });
    }
}

/**
 * Create parcel at coordinates
 */
async function handleParcelCreate(parcel, ack, socket, identity) {
    if (typeof parcel.x !== 'number' || typeof parcel.y !== 'number') {
        console.warn('Invalid parcel coordinates');
        if (ack && typeof ack === 'function') ack({ success: false, error: 'Invalid coordinates' });
        return;
    }

    const createdParcel = myGrid.createParcel(new Xy(parcel.x, parcel.y));
    if (createdParcel) {
        // Set custom reward if provided
        if (parcel.reward && typeof parcel.reward === 'number') {
            createdParcel.reward = parcel.reward;
        }
        console.log(`✅ ${identity.name} created parcel at (${parcel.x}, ${parcel.y})`);
        if (ack && typeof ack === 'function') ack({
            success: true,
            parcel: { id: createdParcel.id, x: parcel.x, y: parcel.y, reward: createdParcel.reward }
        });
    } else {
        console.warn('Failed to create parcel');
        if (ack && typeof ack === 'function') ack({ success: false, error: 'Failed to create parcel' });
    }
}

/**
 * Set parcel reward by ID
 */
async function handleParcelSet(parcel, ack, socket, identity) {
    if (!parcel.id) {
        console.warn('Parcel ID required for set action');
        if (ack && typeof ack === 'function') ack({ success: false, error: 'Parcel ID required' });
        return;
    }

    const p = myGrid.parcelRegistry.get(parcel.id);
    if (p && typeof parcel.reward === 'number') {
        p.reward = parcel.reward;
        console.log(`✅ ${identity.name} set parcel ${parcel.id} reward to ${parcel.reward}`);
        if (ack && typeof ack === 'function') ack({
            success: true,
            parcel: { id: parcel.id, reward: parcel.reward }
        });
    } else {
        console.warn('Failed to set parcel reward');
        if (ack && typeof ack === 'function') ack({ success: false, error: 'Failed to set reward' });
    }
}

/**
 * Dispose parcel by ID or coordinates
 */
async function handleParcelDispose(parcel, ack, socket, identity) {
    if (parcel.id) {
        // Dispose by ID
        const p = myGrid.parcelRegistry.get(parcel.id);
        if (p) {
            p.delete();
            console.log(`✅ ${identity.name} disposed parcel ${parcel.id}`);
            if (ack && typeof ack === 'function') ack({ success: true, id: parcel.id });
        } else {
            console.warn(`Parcel ${parcel.id} not found`);
            if (ack && typeof ack === 'function') ack({ success: false, error: 'Parcel not found' });
        }
    } else {
        // Dispose by coordinates
        if (typeof parcel.x !== 'number' || typeof parcel.y !== 'number') {
            console.warn('Invalid parcel coordinates for dispose');
            if (ack && typeof ack === 'function') ack({ success: false, error: 'Invalid coordinates' });
            return;
        }

        const parcels = Array.from(myGrid.parcelRegistry.getIterator())
            .filter(p => p.x == parcel.x && p.y == parcel.y);

        let disposed = 0;
        for (const p of parcels) {
            myGrid.parcelRegistry.get(p.id)?.delete();
            disposed++;
        }

        console.log(`✅ ${identity.name} disposed ${disposed} parcel(s) at (${parcel.x}, ${parcel.y})`);
        if (ack && typeof ack === 'function') ack({
            success: true,
            disposed,
            x: parcel.x,
            y: parcel.y
        });
    }
}

/**
 * Handle crate management commands
 */
async function handleCrateCommand(action, data, ack, socket, identity) {
    try {
        // Verify admin role
        if (identity.role != 'admin') {
            console.warn(`[AdminCommandHandlers] Unauthorized crate command by ${identity.name}`);
            if (ack && typeof ack === 'function') ack({ success: false, error: 'Unauthorized' });
            return;
        }

        if (typeof action !== 'string' || !data || typeof data !== 'object') {
            console.warn('Invalid crate command');
            if (ack && typeof ack === 'function') ack({ success: false, error: 'Invalid command' });
            return;
        }

        console.log(`[AdminCommandHandlers] ${identity.name} Crate ${action}:`, data);

        switch (action) {
            case 'create':
                await handleCrateCreate(data, ack, socket, identity);
                break;
            case 'dispose':
                await handleCrateDispose(data, ack, socket, identity);
                break;
            default:
                console.warn(`Unknown crate action: ${action}`);
                if (ack && typeof ack === 'function') ack({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error in crate command:', error.message);
        if (ack && typeof ack === 'function') ack({ success: false, error: error.message });
    }
}

/**
 * Create crate at coordinates
 */
async function handleCrateCreate(data, ack, socket, identity) {
    if (typeof data.x !== 'number' || typeof data.y !== 'number') {
        console.warn('Invalid crate coordinates');
        if (ack && typeof ack === 'function') ack({ success: false, error: 'Invalid coordinates' });
        return;
    }

    const createdCrate = myGrid.createCrate(new Xy(data.x, data.y));
    if (createdCrate) {
        console.log(`✅ ${identity.name} created crate at (${data.x}, ${data.y})`);
        if (ack && typeof ack === 'function') ack({
            success: true,
            crate: { id: createdCrate.id, x: data.x, y: data.y }
        });
    } else {
        console.warn('Failed to create crate');
        if (ack && typeof ack === 'function') ack({ success: false, error: 'Failed to create crate' });
    }
}

/**
 * Dispose crate by ID or coordinates
 */
async function handleCrateDispose(data, ack, socket, identity) {
    if (data.id) {
        // Dispose by ID
        const c = myGrid.crateRegistry.get(data.id);
        if (c) {
            c.delete();
            console.log(`✅ ${identity.name} disposed crate ${data.id}`);
            if (ack && typeof ack === 'function') ack({ success: true, id: data.id });
        } else {
            console.warn(`Crate ${data.id} not found`);
            if (ack && typeof ack === 'function') ack({ success: false, error: 'Crate not found' });
        }
    } else {
        // Dispose by coordinates
        if (typeof data.x !== 'number' || typeof data.y !== 'number') {
            console.warn('Invalid crate coordinates for dispose');
            if (ack && typeof ack === 'function') ack({ success: false, error: 'Invalid coordinates' });
            return;
        }

        const crates = Array.from(myGrid.crateRegistry.getIterator())
            .filter(c => c.x == data.x && c.y == data.y);

        let disposed = 0;
        for (const c of crates) {
            myGrid.crateRegistry.get(c.id)?.delete();
            disposed++;
        }

        console.log(`✅ ${identity.name} disposed ${disposed} crate(s) at (${data.x}, ${data.y})`);
        if (ack && typeof ack === 'function') ack({
            success: true,
            disposed,
            x: data.x,
            y: data.y
        });
    }
}

/**
 * Handle tile editing command
 */
async function handleTileCommand(t, socket, identity) {
    try {
        // Verify admin role
        if (identity.role != 'admin') {
            console.warn(`[AdminCommandHandlers] Unauthorized tile command by ${identity.name}`);
            return;
        }

        if (!t || typeof t !== 'object') {
            console.warn('Invalid tile data');
            return;
        }

        const { x, y, type } = t;
        if (typeof x !== 'number' || typeof y !== 'number' || typeof type !== 'string') {
            console.warn('Invalid tile coordinates or type');
            return;
        }

        const tile = myGrid.tileRegistry.getOneByXy({ x, y });
        if (tile) {
            tile.type = parseIOTileType(type);
            console.log(`✅ ${identity.name} set tile at (${x}, ${y}) to ${type}`);
            socket.emit('tile:updated', { x, y, type });
        } else {
            console.warn(`Tile not found at (${x}, ${y})`);
        }
    } catch (error) {
        console.warn(`Error in tile command: ${error.message}`);
    }
}

/**
 * Handle grid restart command
 */
async function handleRestartCommand(socket, identity) {
    try {
        // Verify admin role
        if (identity.role != 'admin') {
            console.warn(`[AdminCommandHandlers] Unauthorized restart command by ${identity.name}`);
            socket.emit('restart:error', { error: 'Unauthorized' });
            return;
        }

        console.log(`[AdminCommandHandlers] ${identity.name} restarting grid...`);
        myGrid.restart();
        console.log('✅ Grid restarted');
        socket.emit('restart:complete', { timestamp: Date.now() });
    } catch (error) {
        console.error('Error restarting grid:', error.message);
        socket.emit('restart:error', { error: error.message });
    }
}

/**
 * Handle agent reward command
 */
async function handleRewardCommand(data, socket, identity) {
    try {
        // Verify admin role
        if (identity.role != 'admin') {
            console.warn(`[AdminCommandHandlers] Unauthorized reward command by ${identity.name}`);
            socket.emit('reward:error', { error: 'Unauthorized' });
            return;
        }

        const { agentId, points } = data;

        const validatedPoints = Number(points);
        if (isNaN(validatedPoints)) {
            console.warn('Invalid points value in reward command');
            socket.emit('reward:error', { error: 'Invalid points value' });
            return;
        }

        console.log(`[AdminCommandHandlers] ${identity.name} rewarding agent ${agentId} with ${validatedPoints} points`);
        const agent = myGrid.agentRegistry.get(agentId);

        if (agent) {
            agent.score += validatedPoints;
            console.log(`✅ Agent ${agentId} rewarded. New score: ${agent.score}`);
            socket.emit('reward:success', {
                agentId,
                points: validatedPoints,
                newScore: agent.score
            });
        } else {
            console.warn(`Agent ${agentId} not found`);
            socket.emit('reward:error', { error: 'Agent not found' });
        }
    } catch (error) {
        console.error('Error rewarding agent:', error.message);
        socket.emit('reward:error', { error: error.message });
    }
}
