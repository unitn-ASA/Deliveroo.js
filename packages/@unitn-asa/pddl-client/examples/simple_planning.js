import { onlineSolve, PddlDomain, PddlAction, PddlExecutor, PddlProblem, Planner, Beliefset } from "../index.js";

Planner.doPlan = onlineSolve;


class LightOn extends PddlAction {

    parameters = 'l'
    precondition = [ 'switched-off l' ]
    effect = [ 'switched-on l', 'not switched-off l' ]

    async exec (...args) {
        console.log( 'LightOn', ...args )
    }

}
const lightOn = new LightOn();

console.log( lightOn.toPddlString() )



const myBeliefset = new Beliefset()
myBeliefset.declare( 'switched-off light1' )

const myGoal = [ 'switched-on light1' ]

// const myPlanner = new Planner( lightOn );

// myPlanner.planAndExec(myBeliefset, myGoal);
// myPlanner.plan( myBeliefset, myGoal )
// .then( plan => myPlanner.exec( plan ) );


var pddlDomain = new PddlDomain( 'lights', lightOn )

var pddlProblem = new PddlProblem()
pddlProblem.addObject(...myBeliefset.objects) //'a', 'b'
pddlProblem.addInit(...myBeliefset.entries.filter( ([fact,value])=>value ).map( ([fact,value])=>fact ))//(...beliefs.literals)
pddlProblem.addGoal(...myGoal)

var plan = await onlineSolve(pddlDomain, pddlProblem);

// PddlExecutor( plan )