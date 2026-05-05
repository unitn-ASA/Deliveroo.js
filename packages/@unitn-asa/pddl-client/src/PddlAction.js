const PADDING = ' '.repeat(4)

/**
 * @class PddlAction
 * @description Class representing a PDDL action, with its name, parameters, preconditions, effects and an executor function to execute the action.
 * @field {String} name - The name of the action.
 * @field {String} parameters - The parameters of the action, in the form of a string, e.g. '?l ?p ?room'.
 * @field {String} precondition - The preconditions of the action, in the form of a string, e.g. 'and (switched-off ?l)'.
 * @field {String} effect - The effects of the action, in the form of a string, e.g. 'and (switched-on ?l) (not (switched-off ?l))'.
 * @field {Function} executor - The function to execute the action, which takes as input the arguments of the action and returns a promise.
 */
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

    /**
     * Name of the action, e.g. 'lighton'.
     * @type {String}
     */
    name;
    /**
     * Parameters of the action, in the form of a string, e.g. '?l ?p ?room'.
     * @type {String}
     */
    parameters;
    /**
     * Precondition of the action, in the form of a string, e.g. 'and (switched-off ?l)'.
     * @type {String}
     */
    precondition;
    /**
     * Effect of the action, in the form of a string, e.g. 'and (switched-on ?l) (not (switched-off ?l))'.
     * @type {String}
     */
    effect;
    /**
     * Executor function of the action.
     * @type {(...args: string[]) => any}
     */
    executor;

    /**
     * 
     * @param {String} name 
     * @param {String} parameters 
     * @param {String} precondition 
     * @param {String} effect 
     * @param {(...args: string[]) => any} executor 
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
     * @param {string} string literals in the form '(not (verb ?arg1 ?arg2)) (verb ?arg1)', e.g. '(not (lighton ?l))'
     * @returns {Array<Array<String>|String>} tokenized e.g. [ 'not', [ 'lighton', '?l' ] ]
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
     * @param {Array<Array<Array<String>|String>|String>} tokenized parametrized
     * e.g. [ 'and', [ 'switched-on', '?l' ], [ 'not', [ 'switched-off', '?l' ] ] ]
     * @param {Object.<String,String>} parametersMap Map of parameters key->value;
     * e.g. {?l: light1, ?p: bob, ?room: kitchen}
     * @returns {Array<Array<Array<String>|String>|String>}
     * e.g. [ 'and', [ 'switched-on', 'light1' ], [ 'not', [ 'switched-off', 'light1' ] ] ]
     */
    static ground ( tokenized, parametersMap ) {
        if ( Array.isArray( tokenized ) ) {
            return tokenized.map( item => {
                if ( Array.isArray( item ) ) {
                    return this.ground( item, parametersMap );
                } else if ( typeof item === 'string' && parametersMap[item] ) {
                    return parametersMap[item];
                }
                return item;
            } );
        }
        return tokenized;
    }

    /**
     * @param {Object.<String,String>} parameterValueMap
     * @returns {Array<String|Array<String>|Array<Array<String>|String>>}
     */
    getGroundedTokenizedPrecondition (parameterValueMap) {
        return PddlAction.ground( PddlAction.tokenize( this.precondition ), parameterValueMap )
    }

    /**
     * @param {Object.<String,String>} parameterValueMap
     * @returns {Array<String|Array<String>|Array<Array<String>|String>>}
     */
    getGroundedTokenizedEffect (parameterValueMap) {
        return PddlAction.ground( PddlAction.tokenize( this.effect ), parameterValueMap )
    }
    
}

