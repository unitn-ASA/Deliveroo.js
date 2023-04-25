const PADDING = ' '.repeat(4)

export default class PddlAction {

    // Example LightOn:
    // name = 'lighton'
    // parameters = '?l'
    // precondition = 'and (switched-off ?l)'
    // effect = 'and (switched-on ?l) (not (switched-off ?l))'
    // 
    // exec (args) {
    //     push a subGoal? applyEffect()?
    // }

    name;
    parameters;
    precondition;
    effect;
    executor;

    /**
     * 
     * @param {String} name 
     * @param {String} parameters 
     * @param {String} precondition 
     * @param {String} effect 
     * @param {Function} executor 
     */
    constructor ( name, parameters, precondition, effect, executor ) {
        this.name = name;
        this.parameters = parameters;
        this.precondition = precondition;
        this.effect = effect;
        this.executor = executor;
    }



    toPddlString () {
        return `\
(:action ${this.name}
${PADDING}:parameters (${this.parameters})
${PADDING}:precondition (${this.precondition})
${PADDING}:effect (${this.effect})
)`
    }
    


    /**
     * @param {'(not (verb ?arg1 ?arg2)) (verb ?arg1)'} literals e.g. '(not (lighton ?l))'
     * @returns { [ true | false, predicate:string] [] } tokenized e.g. [ [false, 'lighton ?l'] ]
     */
    static tokenize ( string ) {
        
        string = string.replace(/\(/g, "[");        // '('  -> '['
        string = string.replace(/\)\s/g, "], ");    // ') ' -> '], '
        string = string.replace(/\)/g, "]");        // ')'  -> ']'
        string = string.replace(/\s+/, ", ");       // ' '  -> ', '
        string = "[" + string + "]";
        string = string.replace(/[^\[\]\,\s]+/g, "\"$&\"");
        string = string.replace(/" /g, "\", ");

        let tokenized = JSON.parse(string);
        
        // tokenized = tokenized.map( t => t[0]=='not' ? [false, t[1].join(' ')] : [true, t.join(' ')] );

        return tokenized;
    }

    /**
     * 
     * @param {Array<Array|String>} tokenized parametrized
     * e.g. [ 'and', [ 'switched-on', '?l' ], [ 'not', [ 'switched-off', '?l' ] ] ]
     * @param {Object} parametersMap Map of parameters key->value;
     * e.g. {?l: light1, ?p: bob, ?room: kitchen}
     * @param {Array<Array|String>} tokenized parametrized
     * e.g. [ 'and', [ 'switched-on', 'l' ], [ 'not', [ 'switched-off', 'l' ] ] ]
     */
    static ground ( tokenized, parametersMap ) {
        return tokenized.map( tokenized => {
            if ( tokenized[1] && Array.isArray( tokenized[1] ) ) {
                for ( let subtokenized of tokenized.slice(1) )
                    this.ground( subtokenized );
            } else {
                tokenized.map( v =>
                    parametersMap[v] ? parametersMap[v] : v
                )
            }
        } )
    }

    getGroundedTokenizedPrecondition (parameterValueMap) {
        return PddlAction.ground( PddlAction.tokenize( this.precondition ), parameterValueMap )
    }

    getGroundedTokenizedEffect (parameterValueMap) {
        return PddlAction.ground( PddlAction.tokenize( effect ), parameterValueMap )
    }
    
}

