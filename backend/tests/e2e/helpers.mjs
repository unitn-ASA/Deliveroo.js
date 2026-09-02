import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import { io } from 'socket.io-client';
import assert from 'node:assert/strict';

/**
 * Shared helpers for E2E tests: server lifecycle, socket clients and REST utilities.
 *
 * Tests boot a dedicated server on a random port with the deterministic
 * fixture map (tests/fixtures/e2e-test-map.json):
 *   - rows y=0 and y=2 are fully walkable corridors
 *   - wall at (2,1), parcel spawner at (0,1), delivery tile at (0,2)
 */

const BACKEND_DIR = new URL('../..', import.meta.url).pathname;
const FIXTURE = new URL('../fixtures/e2e-test-map.json', import.meta.url).pathname;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

/**
 * Reject if the promise does not settle within ms. Used to enforce the
 * "every action gets an ack" contract: a hung acknowledgement fails the
 * test instead of hanging the suite.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} what
 * @returns {Promise<T>}
 */
export function withTimeout(promise, ms, what) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms waiting for ${what}`)), ms);
        })
    ]).finally(() => clearTimeout(timer));
}

/**
 * Boot a dedicated game server on a random port with the fixture map.
 * @param {{fixture?: string}} [options] - alternative game fixture path
 * @returns {Promise<{baseUrl: string, port: number, stop: () => Promise<void>, log: () => string}>}
 */
export async function bootServer({ fixture } = {}) {
    const port = 20000 + Math.floor(Math.random() * 20000);
    const baseUrl = `http://localhost:${port}`;

    const child = spawn('node', ['index.js', '--game', fixture ?? FIXTURE], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: String(port) },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    child.stdout.on('data', (d) => { output += d; });
    child.stderr.on('data', (d) => { output += d; });

    // Wait until the REST API answers (up to 20s)
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
        if (child.exitCode !== null) {
            throw new Error(`Server exited early (code ${child.exitCode}):\n${output.slice(-2000)}`);
        }
        try {
            const res = await fetch(`${baseUrl}/api/plugins`);
            if (res.ok) break;
        } catch { /* not ready yet */ }
        await sleep(200);
    }
    if (Date.now() >= deadline) {
        child.kill();
        throw new Error(`Server did not become ready within 20s:\n${output.slice(-2000)}`);
    }

    const stop = async () => {
        child.kill();
        await new Promise((resolve) => {
            if (child.exitCode !== null) return resolve();
            child.on('exit', resolve);
            setTimeout(resolve, 3000); // do not hang the suite on a stubborn child
        });
    };

    return { baseUrl, port, stop, log: () => output };
}

/**
 * Connect a client (or admin) and track its state via 'you' events.
 * @param {string} baseUrl
 * @param {string} name
 * @param {{admin?: boolean}} [options]
 * @returns {Promise<{socket: object, state: object, id: string}>}
 */
export async function connectClient(baseUrl, name, { admin = false } = {}) {
    const res = await fetch(`${baseUrl}/api/tokens?name=${name}`, admin ? { headers: { password: ADMIN_PASSWORD } } : {});
    const { token } = await res.json();
    assert.ok(token, 'token issued');

    const socket = io(baseUrl, { query: { token }, transports: ['websocket'] });

    // Register BEFORE awaiting connection: the server emits the initial 'you'
    // during connection setup, and under load it can arrive before a listener
    // attached after 'connect' resolves
    const youPromise = withTimeout(
        new Promise((resolve) => socket.once('you', (you) => resolve(you))),
        8000, `${name} initial 'you' event`
    );

    await withTimeout(
        new Promise((resolve, reject) => {
            socket.on('connect', () => resolve());
            socket.on('connect_error', (err) => reject(err));
        }),
        5000, `${name} socket connection`
    );

    const you = await youPromise;

    const state = { ...you };
    socket.on('you', (y) => Object.assign(state, y));
    return { socket, state, id: you.id };
}

/**
 * Emit a move and await its acknowledgement (bounded, never hangs).
 * @param {any} socket
 * @param {string} direction
 * @param {number} [timeout=3000]
 */
export function move(socket, direction, timeout = 3000) {
    return withTimeout(
        new Promise((resolve) => socket.emit('move', direction, resolve)),
        timeout, `move '${direction}' acknowledgement`
    );
}

/**
 * Admin-teleport an agent.
 * @param {any} adminSocket
 * @param {string} agentId
 * @param {number} x
 * @param {number} y
 */
export function teleport(adminSocket, agentId, x, y) {
    return withTimeout(
        new Promise((resolve) => adminSocket.emit('agent:teleport', agentId, { x, y }, resolve)),
        3000, `teleport of ${agentId} to (${x},${y})`
    );
}

/**
 * REST call against the plugin management API.
 * @param {string} baseUrl
 * @param {string} method
 * @param {string} path
 * @param {object} [body]
 * @returns {Promise<{status: number, body: any}>}
 */
export async function rest(baseUrl, method, path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
    });
    let parsed = null;
    try { parsed = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, body: parsed };
}

/**
 * Load and start a builtin plugin from disk, replacing the previous 'move' owner if any.
 * @param {string} baseUrl
 * @param {string} modulePath
 */
export function loadPlugin(baseUrl, modulePath) {
    return rest(baseUrl, 'POST', '/api/plugins/load', { modulePath, autoStart: true });
}

/**
 * Poll until predicate(value) is true or timeout; returns the last value.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {(value: T) => boolean} predicate
 * @param {number} timeoutMs
 * @param {number} [stepMs=200]
 * @returns {Promise<T>}
 */
export async function poll(fn, predicate, timeoutMs, stepMs = 200) {
    const deadline = Date.now() + timeoutMs;
    let last;
    while (Date.now() < deadline) {
        last = await fn();
        if (predicate(last)) return last;
        await sleep(stepMs);
    }
    return last;
}

/**
 * Current number of parcels on the grid.
 * @param {string} baseUrl
 * @returns {Promise<number>}
 */
export async function parcelCount(baseUrl) {
    const { body } = await rest(baseUrl, 'GET', '/api/parcels');
    return Array.isArray(body) ? body.length : -1;
}

/** @type {Map<string, Promise<string>>} admin token per baseUrl */
const adminTokens = new Map();

/**
 * Fetch (and cache) an admin token for admin-only REST endpoints.
 * @param {string} baseUrl
 * @returns {Promise<string>}
 */
async function getAdminToken(baseUrl) {
    if (!adminTokens.has(baseUrl)) {
        adminTokens.set(baseUrl, (async () => {
            const res = await fetch(`${baseUrl}/api/tokens?name=e2e-admin`, { headers: { password: ADMIN_PASSWORD } });
            const { token } = await res.json();
            assert.ok(token, 'admin token issued');
            return token;
        })());
    }
    return adminTokens.get(baseUrl);
}

/**
 * Authenticated REST call (admin token via the raw Authorization header,
 * matching the server's token middleware).
 * @param {string} baseUrl
 * @param {string} method
 * @param {string} path
 * @param {object} [body]
 * @returns {Promise<{status: number, body: any}>}
 */
export async function adminRest(baseUrl, method, path, body) {
    const token = await getAdminToken(baseUrl);
    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            authorization: token
        },
        body: body ? JSON.stringify(body) : undefined
    });
    let parsed = null;
    try { parsed = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, body: parsed };
}

/**
 * Attach an agent component preset.
 * @param {string} baseUrl
 * @param {string} agentId
 * @param {string} agentPreset
 */
export function setAgentPreset(baseUrl, agentId, agentPreset) {
    return adminRest(baseUrl, 'PATCH', `/api/agents/${agentId}`, { agentPreset });
}

/**
 * Disconnect clients so open sockets do not keep the test runner alive
 * after the tests have finished.
 * @param {({socket?: {disconnect?: () => void}} | null | undefined)[]} clients
 */
export function disconnectAll(...clients) {
    for (const client of clients) {
        client?.socket?.disconnect();
    }
}

export { sleep };
