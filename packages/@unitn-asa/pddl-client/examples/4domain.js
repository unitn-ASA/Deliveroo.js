import { onlineSolver, PddlExecutor, PddlProblem, Beliefset, PddlDomain, PddlAction } from "../index.js";

async function main () {

    /** Problem */
    const myBeliefset = new Beliefset();
    myBeliefset.declare( 'switched-off light1' );
    myBeliefset.undeclare( 'switched-on light1' );
    myBeliefset.declare( 'switched-off light2' );

    var pddlProblem = new PddlProblem(
        'lights',
        myBeliefset.objects.join(' '),
        myBeliefset.toPddlString(),
        'and (switched-on light1) (switched-on light2)'
    );

    /** Domain */
    const lightOn = new PddlAction(
        'lightOn',
        '?l',
        'and (switched-off ?l)',
        'and (switched-on ?l) (not (switched-off ?l))',
        async ( l ) => console.log( 'exec lightOn', l )
    );
    console.log( lightOn.toPddlString() )
    console.log( PddlAction.tokenize( lightOn.precondition ) )
    console.log( PddlAction.tokenize( lightOn.effect ) )
    
    var pddlDomain = new PddlDomain( 'lights', lightOn )

    /** Solve */
    let problem = pddlProblem.toPddlString();
    console.log( problem )
    let domain = pddlDomain.toPddlString();
    console.log( domain )

    var plan = await onlineSolver( domain, problem );
    
    /** Execute */
    const pddlExecutor = new PddlExecutor( lightOn );
    pddlExecutor.exec( plan );

}

main();