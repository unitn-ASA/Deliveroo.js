export default class Beliefset {
    
    #objects = new Set();
    #facts = new Map();
    
    constructor () {
    }



    addObject (obj) {
        if (!(typeof obj === 'string'))
            throw('String expected, got ' + typeof obj + ': ' + obj)
        this.#objects.add(obj)
    }

    removeObject (obj) {
        if (!(typeof obj === 'string'))
            throw('String expected, got ' + typeof obj + ': ' + obj)
        this.#objects.delete(obj);
    }

    get objects () {
        return Array.from( this.#objects );
    }



    /**
     * call the declare method with false value
     * @param {String} fact A fact is composed by a predicate and arguments e.g. 'person_in_room bob kitchen'
     * @returns changed
     */
    undeclare (fact) {
        return this.declare(fact, false)
    }

    /**
     * 
     * @param {String} fact A fact is composed by a predicate and arguments e.g. 'person_in_room bob kitchen'
     * @param {boolean} value Fact status, true or false. Default value is true
     * @returns {boolean} true if changed otherwise false
     */
    declare (fact, value = true) {

        if (!(typeof fact === 'string'))
            throw('String expected, got ' + typeof fact + ': ' + fact)
        if (fact.split(' ')[0] == 'not')
            throw('Fact expected, got a negative literal: ' + fact)

        if ( !this.#facts.has(fact) || this.#facts.get(fact) != value ) {

            this.#facts.set(fact, value);

            for (let obj of fact.split(' ').splice(1))
                this.addObject(obj);

            return true;

        }
        
        return false;
    }



    get entries () {
        return Array.from( this.#facts );
    }



    /**
     * @return {Array<String>}    Return an Array of String literals (possibly negated facts) e.g. 'light_on kitchen_light' or 'not light_on kitchen_light'
     */
    get literals () {
        return this.entries.map( ([fact, value]) => (value?fact:'not ('+fact+')') )
    }

    /**
     * 
     * @param {String} literal Possibly negated fact, e.g. 'not light_on'
     */
    apply (...literals) {
        for ( let literal of literals ) {
            var not = literal.split(' ')[0] == 'not'
            var fact = (not?literal.split(' ').splice(1).join(' '):literal)
            this.declare(fact, !not)
        }
    }

    /**
     * Closed World assumption; if i don't know about something then it is false!
     * 
     * @param  {...String} literals Iterable of literals; intended as a conjunction of literals
     * @returns {boolean} true if verified, otherwise false
     */
    check (...literals) {
        for ( let literal of literals ) {
            let not = literal.split(' ')[0] == 'not'
            let fact = (not?literal.split(' ').splice(1).join(' '):literal)
            
            if ( this[fact] )
                if ( not )
                    return false;
                else
                    continue;
            else // Closed World assumption; if i don't know about something then it is false
                if ( not )
                    continue;
                else
                    return false;
        }

        return true;
    }

}
