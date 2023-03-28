import PddlDomain from './PddlDomain.js'
import PddlProblem from './PddlProblem.js'
import fetch from 'node-fetch' // import fetch from 'node-fetch';


/**
 * 
 * @param {String} pddlDomain 
 * @param {String} pddlProblem 
 * @returns { Promise < [ { parallel: boolean, action: string, args: [string] } ] > }
 */
export async function onlineFetch (pddlDomain, pddlProblem) {

    // console.log(JSON.stringify( {domain: domainFile.content, problem: problemFile.content} ))
    var res = await fetch("http://solver.planning.domains/solve", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( {domain: pddlDomain, problem: pddlProblem} )
    }).then(function (res) {
        return res.json();
    }).then(function (res) {
        return res;
    })
    
    // console.log(res);
    // console.log(res.result.plan);

    if (!res.result.plan && res.result.output.split('\n')[0] != ' --- OK.') {
        console.log('No plan found')
        console.log(res)
        throw new Error('Plan not found');
    }

    console.log('Plan found:')
    var planStruct = []
    var plan = []

    if (res.result.plan) {
        for (let step of res.result.plan) {
            /**@type {string}*/
            let line = step.name;
            /**@type {[string]}*/
            line = line.replace('(','').replace(')','').split(' ')
            console.log('- ' + step.name)
            planStruct.push(line);
            
            // var number = line.shift()
            var action = line.shift()
            var args = line
            // console.log(number, action, args)
            plan.push( { parallel: false/*number==previousNumber*/, action: action, args: args } );
        }
    }
    
    return plan;
}



/**
 * 
 * @param {PddlDomain} pddlDomain 
 * @param {PddlProblem} pddlProblem 
 * @returns { Promise < [ { parallel: boolean, action: string, args: [string] } ] > }
 */
export async function onlineSolve( pddlDomain, pddlProblem ) {
    return await onlineFetch( pddlDomain.content, pddlProblem.content )
}
