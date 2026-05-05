import { onlineSolver, PddlExecutor } from "../index.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads a file asynchronously.
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<string>} A promise resolving to the file content.
 */
function readFile ( filePath ) {

    filePath = path.join(__dirname, filePath);
    
    return new Promise( (res, rej) => {

        fs.readFile( filePath, 'utf8', (err, data) => {
            if (err) rej(err)
            else res(data)
        })

    })

}

async function main () {

    let problem = await readFile('./problem-lights.pddl' );
    console.log( problem );
    let domain = await readFile('./domain-lights.pddl' );

    var plan = await onlineSolver(domain, problem);
    if ( ! plan ) {
        console.log('No plan found');
        return;
    }
    console.log( plan );
    
    const pddlExecutor = new PddlExecutor( { name: 'lightOn', executor: (/** @type {string} */ l)=>console.log('exec lighton '+l) } );
    pddlExecutor.exec( plan );

}

main();