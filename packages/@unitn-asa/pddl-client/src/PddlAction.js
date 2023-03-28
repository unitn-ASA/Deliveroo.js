
const padding = ' '.repeat(4)

export default class PddlAction {

    // Example LightOn:
    // parameters = 'l'
    // precondition = [ 'switched-off l' ]
    // effect = [ 'switched-on l', 'not switched-off l' ]
    // 
    // exec (args) {
    //     push a subGoal? applyEffect()?
    // }

    parameters = '';
    precondition = [];
    effect = [];

    * iterateOnPreconditions () {
        for ( const p of this.precondition ) {
            yield this.tokenize ( p );
        }
    }

    * iterateOnEffects () {
        for ( const e of this.effect ) {
            yield this.tokenize ( e )
        }
    }
    
    /**
     * @param {'(not) verb arg1 arg2 arg3'} preconditionOrEffect 
     * @returns {[not:boolean, predicate:string, ...args:string]} tokenized
     */
    tokenize ( preconditionOrEffect ) {
        preconditionOrEffect = preconditionOrEffect.split(' ');
        let index = ( preconditionOrEffect[0] == 'not' ? 1 : 0 );
        var tokenized = [ index==1, preconditionOrEffect[index++], ...preconditionOrEffect.slice(index) ];
        var [ not, predicate, ...args ] = tokenized
        tokenized.toPddlLiteral = () => { return this.toPddlLiteral( tokenized ) }
        return tokenized;
    }

    /**
     * @param {[not:boolean, predicate:string, ...args:string]} tokenized
     * @returns {string} (not (predicate ?a1 ?a2))
     */
    toPddlLiteral ( [ not, predicate, ...args ] ) {
        return (not?'(not ':'') + `(` + predicate + ` ` + args.map( v => '?'+v ) + `)` + (not?')':'')
        // return `${not?'(not ':''}(${predicate} ${args})${not?')':''}`
    }

    /**
     * @param {['(not) verb arg1 arg2 arg3']} preconditionsOrEffects
     * @returns (not (predicate ?a1 ?a2)) (not (predicate ?a1 ?a2)) (not (predicate ?a1 ?a2))
     */
    toPddlPrecontitionEffectString ( preconditionsOrEffects ) {
        return preconditionsOrEffects
        .map( this.tokenize.bind(this) )
        .map( tokenized => tokenized.toPddlLiteral() )
        .join('\n')
    }

    toPddlString () {
        return `\
(:action ${this.constructor.name}
${padding}:parameters (${this.parameters.split(' ').map( p => '?'+p ).join(' ')})
${padding}:precondition (and
${this.toPddlPrecontitionEffectString(this.precondition)}
${padding})
${padding}:effect (and
${this.toPddlPrecontitionEffectString(this.effect)}
${padding})
)`
    }

    
    toString() {
        // return this.constructor.name + '#'+this.id + ' effect:' + this.effect
        return '(' + this.constructor.name + ' ' + Object.values(this.goal.parameters).join(' ') + ')' + ' Effect: ' + this.effect
    }



    getGroundedPrecondition (parameterValueMap) {
        return PddlAction.ground( this.precondition, parameterValueMap )
    }

    checkPrecondition (parameterValueMap) {
        return this.agent.beliefs.check( ...this.getGroundedPrecondition(parameterValueMap) );
    }



    getGroundedEffect (parameterValueMap) {
        return PddlAction.ground( this.effect, parameterValueMap )
    }

    checkEffect (parameterValueMap) {
        return this.agent.beliefs.check( ...this.getGroundedEffect(parameterValueMap) );
    }

    applyEffect (parameterValueMap) {
        for ( let b of this.getGroundedEffect(parameterValueMap) )
            this.agent.beliefs.apply(b)
    }



    /**
     * 
     * @param {Array<String>} parametrizedLiterals Array of parametrized literals;
     * e.g. [['on, 'l'], ['in_room', 'p', 'r']
     * @param {Object} parametersMap Map of parameters key->value;
     * e.g. {l: light1, p: bob, room: kitchen}
     * @returns {Array<String>} Array of grounded literals;
     * e.g. ['on light1', 'in_room bob kitchen']
     */
    static ground (parametrizedLiterals, parametersMap) {
        return parametrizedLiterals.map( (literal) => {
            let possibly_negated_predicate = literal[0]
            let vars = literal.slice(1)
            let grounded = possibly_negated_predicate
            for (let v of vars)
                grounded = grounded + ' ' + parametersMap[v]
            return grounded
        })
    }
    
}

