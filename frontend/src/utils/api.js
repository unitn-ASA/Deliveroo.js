import { DeliveroojsRestClient } from '@unitn-asa/deliveroo-js-sdk/DeliveroojsRestClient';

const HOST = import.meta.env.VITE_SOCKET_IO_HOST || window.location.origin;

const hostInitializedApi = new DeliveroojsRestClient(HOST);

export default hostInitializedApi;
