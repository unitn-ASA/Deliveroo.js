import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { bootServer, connectClient, disconnectAll, move, rest, adminRest, teleport, poll, sleep } from './helpers.mjs';

/**
 * RedLightGreenLight mission: the mission master alternates green, yellow
 * and red phases in chat. The yellow light warns that the red is coming:
 * moving during yellow is still free, while every movement during a red
 * phase costs the penalty.
 */

let server;
let admin;
let runner;
const messages = [];

before(async () => {
    server = await bootServer({ fixture: 'tests/fixtures/e2e-missions-rlgl.json' });
    admin = await connectClient(server.baseUrl, 'admin', { admin: true });
    runner = await connectClient(server.baseUrl, 'runner');
    runner.socket.on('msg', (fromId, fromName, msg) => messages.push({ fromId, fromName, msg }));
    await sleep(200);
});

after(async () => {
    disconnectAll(admin, runner);
    await server.stop();
});

test('moving during yellow is free, during red costs the penalty, during green is free again', async () => {
    const yellowAnnounced = poll(
        () => messages.find((m) => m.fromId === 'mission-master' && String(m.msg).includes('YELLOW LIGHT')),
        Boolean, 10000
    );
    await teleport(admin.socket, runner.id, 1, 0);

    // Yellow anticipates the red: the yellow move happens before the red
    // switch, so it must not cost anything
    await yellowAnnounced;
    await move(runner.socket, 'right');
    const afterYellow = (await rest(server.baseUrl, 'GET', '/api/agents')).body.find((a) => a.id === runner.id)?.score;
    assert.equal(afterYellow, 0, 'no penalty when moving during the yellow warning');

    const redAnnounced = poll(
        () => messages.find((m) => m.fromId === 'mission-master' && String(m.msg).includes('RED LIGHT')),
        Boolean, 5000
    );
    await redAnnounced;
    await move(runner.socket, 'left');
    const afterRed = (await rest(server.baseUrl, 'GET', '/api/agents')).body.find((a) => a.id === runner.id)?.score;
    assert.equal(afterRed, -10, 'one movement during red light costs 10 points');

    const greenAnnounced = poll(
        () => messages.find((m) => m.fromId === 'mission-master' && String(m.msg).includes('GREEN LIGHT')),
        Boolean, 5000
    );
    await greenAnnounced;
    await move(runner.socket, 'right');
    await sleep(200);
    const afterGreen = (await rest(server.baseUrl, 'GET', '/api/agents')).body.find((a) => a.id === runner.id)?.score;
    assert.equal(afterGreen, -10, 'no penalty during green light');
});

test('the mission ends after the configured rounds and announces it', async () => {
    const over = await poll(
        () => messages.find((m) => m.fromId === 'mission-master' && String(m.msg).includes('is over')),
        Boolean, 12000
    );
    assert.ok(over, 'final announcement received');

    const res = await adminRest(server.baseUrl, 'GET', '/api/missions');
    const rlgl = res.body.missions.find((m) => m.type === 'redLightGreenLight');
    assert.equal(rlgl.phase, 'done');
    assert.equal(rlgl.config.yellowMs, 1200);
    assert.equal(rlgl.config.rounds, 3);
});
