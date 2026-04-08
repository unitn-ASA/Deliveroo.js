#!/usr/bin/env node
import { DjsRestClient } from '../src/client/DjsRestClient.js';

const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exit(1); } };

/**
 * Create a minimal Response-like object that JSON.stringify can handle
 */
function makeResponseLike(obj = {}, ok = true) {
    return {
        ok: ok,
        status: ok ? 200 : 500,
        json: async () => obj,
        // text is useful if code does JSON.stringify directly on the value returned by fetch
        text: async () => JSON.stringify(obj)
    };
}

async function run() {
    const api = new DjsRestClient('http://example.test');

    // 1) GET without id - fetch resolves to a plain value -> api.get uses JSON.stringify on it
    let captured = { url: null, options: null };
    const mockReturn = { hello: 'world' };
    global.fetch = async (url, options) => { captured = { url, options }; return mockReturn; };

    let res = await api.get('agents', '', 'tok');
    assert(captured.url === 'http://example.test/api/agents', 'GET url');
    assert(captured.options.method === 'GET', 'GET method');
    assert(captured.options.headers['x-token'] === 'tok', 'GET token header');
    assert(res === JSON.stringify(mockReturn), 'GET response shape');

    // 2) GET with id placeholder - just ensure URL replacement
    captured = { url: null, options: null };
    global.fetch = async (url, options) => { captured = { url, options }; return makeResponseLike({ id: '1' }); };
    res = await api.get('agents/:id', '123', 't2');
    assert(captured.url === 'http://example.test/api/agents/123', 'GET with id url');

    // 3) POST check body and headers
    captured = { url: null, options: null };
    const postBody = { id: 'a', name: 'A' };
    global.fetch = async (url, options) => { captured = { url, options }; return makeResponseLike({ created: true }); };
    res = await api.post('agents', 'ptoken', postBody);
    assert(captured.url === 'http://example.test/api/agents', 'POST url');
    assert(captured.options.method === 'POST', 'POST method');
    assert(captured.options.headers['x-token'] === 'ptoken', 'POST token header');
    assert(captured.options.body === JSON.stringify(postBody), 'POST body is stringified');

    console.log('All tests passed.');
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(2); });
