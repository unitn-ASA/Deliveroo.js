import fetch from 'node-fetch' // import fetch from 'node-fetch';

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

    var res = await fetch("http://solver.planning.domains/solve", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( {domain: pddlDomain, problem: pddlProblem} )
    })
    
    if ( res.status != 200 ) {
        throw new Error( 'Error at http://solver.planning.domains/solve ' + await res.text() );
    }

    res = await res.json();

    // console.log(res);
    // console.log(res.result.plan);

    if ( res.status == 'error' ) {
        
        if ( !res.result.plan && res.result.output.split('\n')[0] != ' --- OK.' ) {
            console.error( 'Plan not found' );
            return;
        }

        // if ( res.result.parse_status == 'err' )
        //     console.error( 'Parse error at http://solver.planning.domains/solve ', res.result.output );

        throw new Error( 'Error at http://solver.planning.domains/solve ' + res.result.error );
    }

    console.log( 'Plan found:' )
    var plan = []

    if ( res.result.plan ) {
        for (let step of res.result.plan) {

            if ( step == '(reach-goal)' )
                break;

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
