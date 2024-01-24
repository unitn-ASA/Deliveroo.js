import { onlineSolver, PddlExecutor, PddlProblem } from "../index.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    var pddlProblem = new PddlProblem(
        'lights',
        'light1 light2',
        '(switched-off light1) (switched-on light2)',
        'and (switched-on light1) (switched-on light2)'
    )
    
    let problem = pddlProblem.toPddlString();
    console.log( problem );

    let domain = await readFile('./domain-lights.pddl' );

    var plan = await onlineSolver( domain, problem );
    
    const pddlExecutor = new PddlExecutor( { name: 'lightOn', executor: (l) => console.log('lighton '+l) } );
    pddlExecutor.exec( plan );

}

main();