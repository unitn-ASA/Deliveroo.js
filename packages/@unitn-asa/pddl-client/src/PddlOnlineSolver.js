import fetch from 'node-fetch' // import fetch from 'node-fetch';

const HOST = 'https://solver.planning.domains:5001';
const API = '/package/dual-bfws-ffparser/solve';

/**
 * @typedef { { parallel: boolean, action: string, args: string [] } } pddlPlanStep
 */


/**
 * @param {String} pddlDomain 
 * @param {String} pddlProblem 
 * @returns { Promise < pddlPlanStep [] > }
 */
export default async function onlineSolver (pddlDomain, pddlProblem) {

    if ( typeof pddlDomain !== 'string' && ! pddlDomain instanceof String )
        throw new Error( 'pddlDomain is not a string' );

    if ( typeof pddlProblem !== 'string' && ! pddlProblem instanceof String )
        throw new Error( 'pddlProblem is not a string' );

    // Posting solving request
    var res = await fetch( HOST + API, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( {domain: pddlDomain, problem: pddlProblem} )
    })
    
    if ( res.status != 200 ) {
        throw new Error( `Error at ${HOST}${API} ${await res.text()}` );
    }

    res = await res.json();

    if ( ! res.result ) {
        throw new Error( `No value "result" from ${HOST+API} ` + res );
    }

    // console.log(res);

    // Getting result
    res = await fetch(HOST+res.result, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( {adaptor: "planning_editor_adaptor"} )
    });

    if ( res.status != 200 ) {
        throw new Error( `Error at ${HOST+res.result} ` + await res.text() );
    }
    
    res = await res.json();

    // console.log(res);
    // console.log(res.plans[0].result);
    // console.log(res.plans[0].result.plan);

    if ( res.status != 'ok' || res.plans[0].status != 'ok' ) {
        throw new Error( `Error at ${HOST+API} ` + res );
    }

    if ( res.plans[0].result.output.split('\n')[0] != ' --- OK.' ) {
        console.error( 'Plan not found', res.plans[0].result.output );
        return;
    }

    console.log( 'Plan found:' )
    var plan = []

    if ( res.plans[0].result.plan ) {
        for ( let step of res.plans[0].result.plan ) {

            /**@type {string}*/
            let line = step.name || step;

            console.log('- ' + line);

            /**@type {[string]}*/
            line = line.replace('(','').replace(')','').split(' ')

            // var number = line.shift()
            var action = line.shift()
            var args = line
            
            plan.push( { parallel: false/*number==previousNumber*/, action: action, args: args } );
        }
    }
    
    return plan;
}
