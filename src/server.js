const http = require('http');
const app = require('./app');

const server = http.createServer(app);

module.exports = server;