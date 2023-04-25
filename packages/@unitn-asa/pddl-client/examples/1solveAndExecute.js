import { onlineSolver, PddlExecutor } from "../index.js";
import fs from 'fs';

function readFile ( path ) {
    
    return new Promise( (res, rej) => {

        fs.readFile( path, 'utf8', (err, data) => {
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
    console.log( plan );
    
    const pddlExecutor = new PddlExecutor( { name: 'lightOn', executor: (l)=>console.log('exec lighton '+l) } );
    pddlExecutor.exec( plan );

}

main();