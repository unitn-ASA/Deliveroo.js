const Intention =  require('../../bdi/Intention')
const BeliefSet =  require('../../bdi/Beliefset')

class PddlIntention extends Intention {

    constructor (agent, goal) {
        super(agent, goal)
        this.parameters = this.constructor.validateParameters(goal, this.agent)
    }
    


    /**
     * Implementation based on declaration of static parametrized effects e.g constructor.effect = [ ['holding', 'ob'], ['empty'], ['clear', 'ob'], ['on-table', 'ob'] ]
 
     * @param {String[]} goal    array of facts
     * @returns {Object}   params to value map of parameters that can be used to achieve the goal
     */
    validateParameters (goal, agent) {
        goal = goal.map( e=>e.split(' '))

        function valid_params_for_preconditions(preconditions, incoming_params={}) { // given precondition prec

            var precond = preconditions[0]
            if (precond==undefined)
                return true;

            for (let literal in this.agent.beliefSet.literals) { // for all current beliefset

                var current_params = {}
                Object.assign(current_params, incoming_params)

                if (    literal.length != precond.length ||
                        literal[0] != precond[0] ||
                        ( literal[0] == 'not' && (literal[1] != precond[1]) )
                    ) // belief NOT compatible, != number of parameters or != predicate
                    continue; // try with remaining effects
                
                var params_n = ( literal[0] == 'not' ? literals.length-2 : literal.length-1 )
                for (let i=params_n; i>0; i--) { // for each param
                    let key = literal[i]
                    let value = precond[i]
                    if (!(key in current_params)) // save desired value of each param
                        current_params[key] = value
                    if (current_params[key]!=value) // if parameter DOES NOT match
                        break; // parameter has already been assigned to a different value
                }

                if (i>0) // conflict with already defined parameters has been found and loop broke earlier
                    continue; // try with remaining effects
                
                var complete_params = valid_params_for_preconditions(preconditions.slice(1), current_params) // recursion
                
                if (complete_params)
                    return current_params;

                // conflicts in fulfilling all the preconditions with these parameters
                // try with remaining facts

            }

            return false; // no valid parameter found for this effect to be applicable to this goal

        }

        function valid_params_for_effects(goals, incoming_params={}) { // given goal g
            
            var g = goals[0]
            if (g==undefined)
                return true;

            for (let e in this.constructor.effect) { // for all possible affects

                var current_params = {}
                Object.assign(current_params, incoming_params)

                if (e.length != g.length || e[0] != g[0]) // effect NOT compatible, != number of parameters or != predicate
                    continue; // try with remaining effects
                
                for (let i=e.length-1; i>0; i--) { // for each param
                    let key = e[i]
                    let value = g[i]
                    if (!(key in current_params)) // save desired value of each param
                        current_params[key] = value
                    if (current_params[key]!=value) // if parameter DOES NOT match
                        break; // parameter has already been assigned to a different value
                }

                if (i>0) // conflict with already defined parameters has been found and loop broke earlier
                    continue; // try with remaining effects
                
                var complete_params = valid_params_for_effects(goals.slice(1), current_params) // recursion

                complete_params = valid_params_for_preconditions(this.constructor.precondition, current_params) // check if up to now precondition can also be satisfied
                
                if (complete_params)
                    return current_params;

                // conflicts in fulfilling the whole goal with these parameters
                // try with remaining effects

            }

            return false; // no valid parameter found for this effect to be applicable to this goal

        }
        
        // return valid parameters to fulfill this goal with the effects of this intentione; or return false
        return valid_params_for_effects(goal, {})

    }

    

    get precondition () {
        return BeliefSet.ground(this.constructor.precondition, this.parameters)
    }

    checkPrecondition (beliefSet) {
        return beliefSet.check(this.precondition);
    }

    get effect () {
        return BeliefSet.ground(this.constructor.effect, this.parameters)
    }

    checkEffect (beliefSet) {
        return beliefSet.check(this.effect);
    }

    applyEffect (beliefSet) {
        for ( let b of this.effect )
            beliefSet.apply(b)
    }



}



module.exports = PddlIntention