import PddlDomain from './PddlDomain.js'
import PddlProblem from './PddlProblem.js'
import PddlExecutor from './PddlExecutor.js'



/**
 * Abstract class.
 * abstract doPlan(pddlDomain, pddlProblem)
 */
export default class Planner extends PddlExecutor {
    
    constructor ( ...pddlActionClasses ) {
        super( ...pddlActionClasses )
        for ( let actionClass of pddlActionClasses ) {
            this.addAction(actionClass)
        }
    }

    actions = {}

    addAction (actionClass) {
        this.actions[actionClass.constructor.name.toLowerCase()] = actionClass
    }

    getAction (name) {
        return this.actions[name.toLowerCase()]
    }

    async plan (beliefs, goals) {
        
        var pddlDomain = new PddlDomain()
        pddlDomain.addAction(...Object.values(this.actions))
        var domainFile = await pddlDomain.saveToFile()

        var pddlProblem = new PddlProblem()
        pddlProblem.addObject(...beliefs.objects) //'a', 'b'
        pddlProblem.addInit(...beliefs.entries.filter( ([fact,value])=>value ).map( ([fact,value])=>fact )) // (...beliefs.literals)
        pddlProblem.addGoal(...goals)
        var problemFile = await pddlProblem.saveToFile()

        Planner.nextId++;

        return await this.constructor.doPlan(pddlDomain, pddlProblem)

    }

    async planAndExec (beliefs, goals) {
        
        var plan = await this.plan(beliefs, goals);
        return await this.exec( plan );

    }

}

// var kitchenAgent = new Agent('kitchen')
// kitchenAgent.intentions.push(DimOnLight)
// kitchenAgent.intentions.push(Blackbox)

// var blackbox = new Blackbox(kitchenAgent, new LightOn({l: 'light1'}), './tmp/domain-lights.pddl', './tmp/problem-lights.pddl')
// blackbox.run()

