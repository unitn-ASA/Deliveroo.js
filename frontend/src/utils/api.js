import { APIClient } from '@unitn-asa/deliveroo-js-sdk';

const HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

const hostInitializedApi = new APIClient(HOST);

export default hostInitializedApi;
