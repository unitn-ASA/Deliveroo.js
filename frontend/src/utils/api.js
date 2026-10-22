import { DjsRestClient } from '@unitn-asa/deliveroo-js-sdk/client';

const HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

const hostInitializedApi = new DjsRestClient(HOST);

/**
 * @param {string} token admin authorization token
 * @returns {Promise<object>} the missions of the game script (admin only), 503 when the plugin is not running
 */
export async function getMissions(token) {
    const res = await fetch(`${HOST}/api/missions`, {
        headers: { authorization: token }
    });
    return { status: res.status, body: await res.json().catch(() => null) };
}

export default hostInitializedApi;
