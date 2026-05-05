/**
 * @typedef { { parallel: boolean, action: string, args: string [] } } PddlPlanStep
 */

/**
 * @typedef { PddlPlanStep [] } PddlPlan
 */

/**
 * @typedef { { name: string, executor: (...args: string[]) => any } } ExecutableAction
 */

export default class PddlExecutor {

    /**
     * @type {Object.<string, ExecutableAction>} actions - A dictionary of executable actions, indexed by their name in lowercase.
     */
    actions = {}

    /**
     *
     * @param { ...ExecutableAction } actions
     */
    constructor ( ...actions ) {
        this.addAction(...actions);
    }

    /**
     *
     * @param  {...ExecutableAction} actions
     */
    addAction (...actions) {
        for ( let action of actions ) {
            this.actions[action.name.toLowerCase()] = action;
        }
    }

    /**
     *
     * @param {string} name
     * @returns {ExecutableAction} the executable action with the given name
     */
    getAction (name) {
        return this.actions[name.toLowerCase()]
    }

    /**
     * @param {PddlPlan} plan 
     */
    async exec (plan) {

        if ( ! plan )
            return;
        
        var previousStepGoals = []

        for (const step of plan) {
            if (step.parallel) {
                console.log( 'Starting concurrent step', step.action, ...step.args )
            }
            else {
                await Promise.all(previousStepGoals)
                previousStepGoals = []
                console.log( 'Starting sequential step', step.action, ...step.args )
            }

            let action = this.getAction(step.action)
            if ( !action || !action.executor ) {
                console.error( new Error("No executor for pddlAction" + step.action + ". Skip and continue with next plan step.") )
                continue;
            }

            var exec = action.executor(...step.args)
            if ( exec && exec.catch ) {
                exec.catch(/** @param {Error} err */ err => { throw err } ); //new Error('Step failed');
                previousStepGoals.push( exec );
            }
            else {
                previousStepGoals.push( Promise.resolve() );
            }
        }

        // wait for last steps to complete before finish blackbox plan execution intention
        await Promise.all(previousStepGoals)

    }

}

