import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootServer, connectClient, disconnectAll, move, rest, adminRest, teleport, poll, sleep } from './helpers.mjs';

/**
 * Missions plugin: script loading from the game configuration (invalid
 * entries skipped), GoTo bonus and penalty, unatantum claiming, exactly-N
 * parcel delivery and question-answer through the communications hub.
 * The RedLightGreenLight timed mission is covered on its own fixture.
 */

let server;
let admin;
let runner;
const messages = [];

/** Award statistics of a mission by its position in the game script */
async function missionAwards(index) {
    const { body } = await adminRest(server.baseUrl, 'GET', '/api/missions');
    return body.missions.find((m) => m.index === index)?.stats.awards ?? -1;
}

async function agentScore(agentId) {
    const { body } = await rest(server.baseUrl, 'GET', '/api/agents');
    return body.find((a) => a.id === agentId)?.score;
}

function createParcel(x, y, reward = 1) {
    return new Promise((resolve) => admin.socket.emit('parcel', 'create', { x, y, reward }, resolve));
}

function pickup(socket) {
    return new Promise((resolve) => socket.emit('pickup', resolve));
}

function putdown(socket) {
    // Wire format: (selected, ack) — an empty selection drops everything
    return new Promise((resolve) => socket.emit('putdown', [], resolve));
}

before(async () => {
    server = await bootServer({ fixture: 'tests/fixtures/e2e-missions.json' });
    admin = await connectClient(server.baseUrl, 'admin', { admin: true });
    runner = await connectClient(server.baseUrl, 'runner');
    runner.socket.on('msg', (fromId, fromName, msg) => messages.push({ fromId, fromName, msg }));
    await sleep(300);
});

after(async () => {
    disconnectAll(admin, runner);
    await server.stop();
});

test('the missions plugin loads the valid script entries and skips the invalid one', async () => {
    const forbidden = await rest(server.baseUrl, 'GET', '/api/missions');
    assert.equal(forbidden.status, 403, 'the missions script is admin-only');

    const res = await adminRest(server.baseUrl, 'GET', '/api/missions');
    assert.equal(res.status, 200);
    assert.equal(res.body.missions.length, 5, 'invalid mission skipped');
    assert.deepEqual(
        res.body.missions.map((m) => m.type),
        ['goto', 'goto', 'deliverExactlyNParcels', 'questionAnswer', 'goto']
    );
    assert.equal(res.body.missions[0].bonus, 50);
    assert.deepEqual(res.body.missions[0].config.coordinates, [{ x: 4, y: 0 }]);

    const [publicPlugins, publicStatus, hiddenMission, adminPlugins] = await Promise.all([
        rest(server.baseUrl, 'GET', '/api/plugins'),
        rest(server.baseUrl, 'GET', '/api/plugins/status'),
        rest(server.baseUrl, 'GET', '/api/plugins/mission%3A0%3Agoto/status'),
        adminRest(server.baseUrl, 'GET', '/api/plugins')
    ]);
    assert.equal(publicPlugins.body.plugins.some((plugin) => plugin.id.startsWith('mission:')), false, 'mission plugins are internal to non-admin users');
    assert.equal(publicStatus.body.plugins.some((plugin) => plugin.id.startsWith('mission:')), false, 'public plugin status has no mission instances');
    assert.equal(hiddenMission.status, 404, 'a guessed internal mission plugin id stays hidden');
    assert.equal(adminPlugins.body.plugins.filter((plugin) => plugin.id.startsWith('mission:')).length, 5, 'each valid descriptor runs as an independent plugin');
});

test('game scripts are visible to admins but stripped from public game responses', async () => {
    const [publicGame, adminGame, publicGames] = await Promise.all([
        rest(server.baseUrl, 'GET', '/api/games/missions_tournament'),
        adminRest(server.baseUrl, 'GET', '/api/games/missions_tournament'),
        rest(server.baseUrl, 'GET', '/api/games')
    ]);

    assert.equal(publicGame.status, 200);
    assert.equal(publicGame.body.missions, undefined, 'individual public game response has no mission script');
    assert.ok(Array.isArray(adminGame.body.missions) && adminGame.body.missions.length > 0, 'admin gets the full game script');

    const publicTournament = publicGames.body.find((game) => game.title === 'missions_tournament');
    assert.ok(publicTournament, 'missions tournament is present in the public game list');
    assert.equal(publicTournament.missions, undefined, 'public game list has no mission script');
});

test('GoTo awards the bonus once an agent reaches the target (unatantum)', async () => {
    await teleport(admin.socket, runner.id, 0, 0);
    for (let i = 0; i < 4; i++) {
        await move(runner.socket, 'right');
    }

    assert.equal(await poll(() => missionAwards(0), (n) => n === 1, 3000), 1);
    assert.equal(await agentScore(runner.id), 50);

    assert.ok(
        messages.some((m) => m.fromId === 'mission-master' && m.fromName === 'Mission Master' && m.msg.includes('runner') && m.msg.includes('+50')),
        'award announced in chat by the mission master'
    );
});

test('a claimed GoTo mission is not awarded again (unatantum)', async () => {
    for (let i = 0; i < 4; i++) {
        await move(runner.socket, 'left');
    }
    for (let i = 0; i < 4; i++) {
        await move(runner.socket, 'right');
    }
    await sleep(300);

    assert.equal(await missionAwards(0), 1, 'unatantum mission claimed once');
    assert.equal(await agentScore(runner.id), 50);
});

test('a GoTo penalty with unatantum false is applied at every passage', async () => {
    await teleport(admin.socket, runner.id, 0, 2);
    await move(runner.socket, 'right');

    assert.equal(await poll(() => missionAwards(1), (n) => n === 1, 3000), 1);
    assert.equal(await agentScore(runner.id), 45);

    await move(runner.socket, 'left');
    await move(runner.socket, 'right');
    await sleep(300);

    assert.equal(await missionAwards(1), 2, 'penalty applied again on the second passage');
    assert.equal(await agentScore(runner.id), 40);
});

test('deliverExactlyNParcels awards on exactly one delivered parcel, not on two', async () => {
    await teleport(admin.socket, runner.id, 0, 2);

    const created = await createParcel(0, 2, 1);
    assert.equal(created.success, true, `parcel created: ${JSON.stringify(created)}`);

    const picked = await pickup(runner.socket);
    assert.equal(picked.length, 1, 'one parcel picked up');
    const dropped = await putdown(runner.socket);
    assert.equal(dropped.length, 1, 'one parcel put down');

    assert.equal(await poll(() => missionAwards(2), (n) => n === 1, 3000), 1);
    // delivery scoring (+1) plus mission bonus (+60)
    assert.equal(await agentScore(runner.id), 101);

    // Two parcels at once: delivery scoring applies, the mission does not
    await createParcel(0, 2, 1);
    await createParcel(0, 2, 1);
    await pickup(runner.socket);
    await putdown(runner.socket);
    await sleep(300);

    assert.equal(await missionAwards(2), 1, 'no award for two parcels');
    assert.equal(await agentScore(runner.id), 103);
});

test('questionAnswer awards agents answering correctly through shout or say', async () => {
    // Wrong answer: no award
    const shoutWrong = await new Promise((resolve) => runner.socket.emit('shout', 'forty-two', resolve));
    assert.ok(shoutWrong.success !== false);
    await sleep(300);
    assert.equal(await missionAwards(3), 0, 'wrong answer ignored');

    // Another agent shouts the right answer
    const answerer = await connectClient(server.baseUrl, 'answerer');
    try {
        const shout = await new Promise((resolve) => answerer.socket.emit('shout', ' 42 ', resolve));
        assert.ok(shout.success !== false);

        assert.equal(await poll(() => missionAwards(3), (n) => n === 1, 3000), 1);
        assert.equal(await agentScore(answerer.id), 70);

        // The runner claims it too, addressing the mission master privately
        const said = await new Promise((resolve) => runner.socket.emit('say', 'mission-master', '42', resolve));
        assert.ok(said.success !== false);

        await poll(() => missionAwards(3), (n) => n === 2, 3000);
        // 103 so far (goto 50, penalties -10, deliveries +3, mission bonus 60) plus the say bonus 70
        assert.equal(await agentScore(runner.id), 173);
    } finally {
        disconnectAll(answerer);
    }
});

test('a game without a missions field carries no missions (nothing inherited from the previous map)', async () => {
    // Sanity: the current game carries the script
    const initial = await adminRest(server.baseUrl, 'GET', '/api/missions');
    assert.ok(initial.body.missions.length > 0, 'missions instantiated from the fixture');

    // Switch to a game with no missions field at all
    const patch = await adminRest(server.baseUrl, 'PATCH', '/api/configs', { GAME: { title: 'missions-less game' } });
    assert.equal(patch.status, 200, `patch failed: ${JSON.stringify(patch.body)}`);

    const cleared = await poll(
        async () => (await adminRest(server.baseUrl, 'GET', '/api/missions')).body,
        (body) => Array.isArray(body.missions) && body.missions.length === 0,
        5000
    );
    assert.equal(cleared.missions.length, 0, 'no mission survives the switch to a mission-less game');

    // The plugin keeps running and a game with its own script
    // re-instantiates the missions
    const restored = await adminRest(server.baseUrl, 'PATCH', '/api/configs', {
        GAME: {
            title: 'e2e-missions',
            missions: [{ type: 'goto', prompt: 'Reach (1,0) again', bonus: 10, coordinates: [{ x: 1, y: 0 }] }]
        }
    });
    assert.equal(restored.status, 200, `patch failed: ${JSON.stringify(restored.body)}`);

    const back = await poll(
        async () => (await adminRest(server.baseUrl, 'GET', '/api/missions')).body,
        (body) => Array.isArray(body.missions) && body.missions.some((m) => (m.prompt ?? '').includes('Reach (1,0) again')),
        5000
    );
    assert.ok(back.missions.some((m) => (m.prompt ?? '').includes('Reach (1,0) again')), 'the new script is instantiated');
});

test('the missions endpoint answers 503 when the plugin is not running', async () => {
    const plain = await bootServer();
    try {
        const forbidden = await rest(plain.baseUrl, 'GET', '/api/missions');
        assert.equal(forbidden.status, 403, 'admin token required regardless of the plugin');

        const res = await adminRest(plain.baseUrl, 'GET', '/api/missions');
        assert.equal(res.status, 503);
    } finally {
        await plain.stop();
    }
});

test('a mission with startAfter stays inactive and unclaimable until its timer fires', async () => {
    const server = await bootServer({ fixture: 'tests/fixtures/e2e-missions.json' });
    const admin = await connectClient(server.baseUrl, 'admin', { admin: true });
    const runner = await connectClient(server.baseUrl, 'runner');
    try {
        const missionsOf = async () => (await adminRest(server.baseUrl, 'GET', '/api/missions')).body.missions;
        const delayed = () => missionsOf().then((list) => list.find((m) => m.index === 4));

        // The delayed mission is listed from the start, greyed out
        const waiting = await poll(delayed, (m) => m && m.active === false && m.startsAt > Date.now() - 1000, 5000);
        assert.ok(waiting.startsAt, 'the admin sees the not-yet-started mission with its start time');

        // Standing on the target before the timer fires awards nothing
        if (waiting.active === false && waiting.startsAt > Date.now()) {
            await teleport(admin.socket, runner.id, 2, 2);
            await move(runner.socket, 'right');
            await poll(() => runner.state.x, (x) => Math.floor(x) === 3, 3000);
            const stillWaiting = await delayed();
            if (stillWaiting.active === false) {
                assert.equal(stillWaiting.stats.awards, 0, 'nothing can be claimed before the mission starts');
            }
        }

        // Once the timer fires the mission activates and becomes claimable
        const started = await poll(delayed, (m) => m.active === true && m.startsAt === null, 10000);
        assert.equal(started.active, true, 'the mission is active after its startAfter delay');

        await move(runner.socket, 'left');
        await move(runner.socket, 'right');
        const awards = await poll(() => missionAwardsOn(server.baseUrl, 4), (n) => n === 1, 5000);
        assert.equal(awards, 1, 'the delayed mission is claimable once active');
    } finally {
        disconnectAll(admin, runner);
        await server.stop();
    }
});

test('the mission script never reaches non-admin agents through the config broadcast', async () => {
    const server = await bootServer({ fixture: 'tests/fixtures/e2e-missions.json' });
    const admin = await connectClient(server.baseUrl, 'admin', { admin: true });
    const runner = await connectClient(server.baseUrl, 'runner');
    try {
        /** @type {any[]} */
        const adminConfigs = [];
        /** @type {any[]} */
        const runnerConfigs = [];
        admin.socket.on('config', (config) => adminConfigs.push(config));
        runner.socket.on('config', (config) => runnerConfigs.push(config));

        // A server config update (no GAME change: the script stays intact)
        // re-broadcasts the configuration to every connected client
        const patch = await adminRest(server.baseUrl, 'PATCH', '/api/configs', { CLOCK: 50 });
        assert.equal(patch.status, 200, `patch failed: ${JSON.stringify(patch.body)}`);

        await poll(async () => adminConfigs.length > 0 && runnerConfigs.length > 0, Boolean, 5000);

        const runnerGame = runnerConfigs[runnerConfigs.length - 1]?.GAME;
        assert.ok(runnerGame, 'the agent received the config update');
        assert.equal(runnerGame.missions, undefined, 'the mission script is stripped for non-admin agents');

        const adminGame = adminConfigs[adminConfigs.length - 1]?.GAME;
        assert.ok(Array.isArray(adminGame?.missions) && adminGame.missions.length > 0, 'the admin still receives the mission script');
    } finally {
        disconnectAll(admin, runner);
        await server.stop();
    }
});

/**
 * Award statistics of a mission on a dedicated server (self-contained tests).
 * @param {string} baseUrl
 * @param {number} index
 */
async function missionAwardsOn(baseUrl, index) {
    const { body } = await adminRest(baseUrl, 'GET', '/api/missions');
    return body.missions.find((m) => m.index === index)?.stats.awards ?? -1;
}
