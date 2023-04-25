import { onlineSolver, PddlDomain, PddlAction, PddlExecutor, PddlProblem, Planner, Beliefset } from "../index.js";

Planner.doPlan = onlineSolver;

const lightOn = new PddlAction(
    'LightOn',
    '?l',
    '(switched-off ?l)',
    '(switched-on ?l) (not (switched-off ?l))',
    async ( ...args ) => console.log( 'LightOn', ...args )
);

console.log( lightOn.toPddlString() )

console.log( PddlAction.tokenize( lightOn.precondition ) )
console.log( PddlAction.tokenize( lightOn.effect ) )


const myBeliefset = new Beliefset()
myBeliefset.declare( 'switched-off light1' )

const myGoal = [ 'switched-on light1' ]

// const myPlanner = new Planner( lightOn );

// myPlanner.planAndExec(myBeliefset, myGoal);
// myPlanner.plan( myBeliefset, myGoal )
// .then( plan => myPlanner.exec( plan ) );


var pddlDomain = new PddlDomain( 'lights', lightOn )
pddlDomain.saveToFile();

console.log( pddlDomain.toPddlString() )

var pddlProblem = new PddlProblem( 'lights' )
pddlProblem.addObject(...myBeliefset.objects) //'a', 'b'
pddlProblem.addInit(...myBeliefset.entries.filter( ([fact,value])=>value ).map( ([fact,value])=>fact ))//(...beliefs.literals)
pddlProblem.addGoal(...myGoal)
pddlProblem.saveToFile();

var plan = await onlineSolver(pddlDomain.toPddlString(), pddlProblem.toPddlString());

const pddlExecutor = new PddlExecutor( lightOn )
pddlExecutor.exec( plan )