import {DjsConnect} from '../src/client/DjsConnect.js';

const socket = DjsConnect();
socket.emitShout( 'Hello world!' );