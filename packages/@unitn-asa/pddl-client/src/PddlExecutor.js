
/**
 * @typedef { { parallel: boolean, action: string, args: [string] } } PddlStep
 */

/**
 * @typedef { [ PddlStep ] } PddlPlan
 */

export default class PddlExecutor {
    
    /**
     * 
     * @param { ...{pddlAction} } } actions 
     */
    constructor ( ...actions ) {
        for ( let actionClass of actions ) {
            this.addAction(actionClass)
        }
    }

    actions = {}

    addAction (intentionClass) {
        this.actions[intentionClass.name.toLowerCase()] = intentionClass
    }

    getAction (name) {
        return this.actions[name]
    }

    /**
     * @param {PddlPlan} plan 
     */
    async exec (plan) {
        
        var previousStepGoals = []

        for (const step of plan) {
            if (step.parallel) {
                console.log( 'Starting concurrent step', step.action, ...step.args )
            }
            else {
                await Promise.all(previousStepGoals)
                previousStepGoals = []
                console.log( 'Starting sequential step ', step.action, ...step.args )
            }

            let actionClass = this.getAction(step.action)
            if (!actionClass)
                throw new Error( "pddlAction class not found for " + step.action )

            previousStepGoals.push(
                new actionClass().exec(...step.args).catch( err => {
                    throw err//new Error('Step failed');
                } )
            )
        }

        // wait for last steps to complete before finish blackbox plan execution intention
        await Promise.all(previousStepGoals)

    }

}

// var kitchenAgent = new Agent('kitchen')
// kitchenAgent.intentions.push(DimOnLight)
// kitchenAgent.intentions.push(Blackbox)

// var blackbox = new Blackbox(kitchenAgent, new LightOn({l: 'light1'}), './tmp/domain-lights.pddl', './tmp/problem-lights.pddl')
// blackbox.run()

