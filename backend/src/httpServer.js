import http from 'http';
import app from './app.js';

const server = http.createServer(app);

export default server;