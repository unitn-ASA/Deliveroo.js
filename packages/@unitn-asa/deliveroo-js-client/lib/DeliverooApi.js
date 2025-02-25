import { io } from "socket.io-client";
import { default as argsParser } from "args-parser";
import ioClientSocket from "./ioClientSocket";



/**
 * Takes the following arguments from console:
 * token or name
 * e.g:
 * $ node index.js -token=... -name=marco
 * $ npm start -- -token=... -name=marco
 */
const args = argsParser(process.argv);
let NAME = args['name'];
let TOKEN = args['token'];
let HOST = args['host'];



export default class DeliverooApi extends ioClientSocket {

    constructor ( host, token ) {

        {
            let opts = {
                autoConnect: false,
                withCredentials: false,
                extraHeaders: { 'x-token': TOKEN || token }
                // query: { name: NAME }
                // path: '/'
            };
            if (NAME)
                opts.query = { name: NAME }
            
            super( io( HOST || host, opts ) );
        }

        /**
         * Bradcast log
         */
        const oldLog = console.log;
        console.log = ( ...message ) => {
            this.emitLog( ...message );
            oldLog.apply( console, message );
        };

    }

}
