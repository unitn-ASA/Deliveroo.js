import { DjsRestClient } from '@unitn-asa/deliveroo-js-sdk/client';

const HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

const hostInitializedApi = new DjsRestClient(HOST);
export default hostInitializedApi;
