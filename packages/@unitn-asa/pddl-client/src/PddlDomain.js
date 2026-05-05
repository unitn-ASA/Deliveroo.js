import fs from 'fs';
import PddlAction from './PddlAction.js'


const PADDING = ' '.repeat(4)

export default class PddlDomain {
    
    static nextId = 0;

    /**
     * Name of the domain, automatically generated as 'domain-' + name + '-' + nextId, where nextId is a static variable incremented at each instantiation.
     * @type {String}
     */
    name = '';
    
    /**
     * Predicates of the domain, in the form of an array of strings, e.g. ['light-on ?l', 'switched-off ?l'].
     * @type {String[]}
     */
    predicates = [];
    
    /**
     * Actions of the domain, in the form of an array of PddlAction instances.
     * @type {PddlAction[]}
     */
    actions = [];

    /**
     * Constructor for creating a PDDL domain.
     * @param {string} name 
     * @param {PddlAction[]} actions 
     */
    constructor ( name, ...actions ) {
        
        this.name = 'domain-' + name + '-' + PddlDomain.nextId++;
        this.addAction(...actions)
        
    }
    
    /**
     * 
     * @param {String} predicate - Predicate to add, in the form of a string, e.g. 'light-on ?l'. 
     * @returns 
     */
    addPredicate (predicate) { // predicate = 'light-on ?l'
        if ( this.predicates.find( (e) => e == predicate ) )
            return false;
        if ( this.predicates.find( (e) => e.split(' ')[0] == predicate.split(' ')[0] && e.split(' ').length != predicate.split(' ').length ) )
            throw new Error( 'Duplicated predicate with different number of parameters!' )
        this.predicates.push(predicate)
        return true;
    }

    /**
     * 
     * @param {...PddlAction} actions 
     */
    addAction (...actions) {

        for ( let action of actions ) {
            
            /** @argument {Array<Array<Array<String>|String>|String>} tokenized e.g. [ 'and', [ 'switched-on', '?l' ], [ 'not', [ 'switched-off', '?l' ] ] ] */
            const recursiveNavigateTokenized = ( tokenized ) => {
                if ( tokenized[1] && Array.isArray(tokenized[1]) ) {
                    for ( let subtokenized of tokenized.slice(1) )
                        if ( Array.isArray( subtokenized ) )
                            recursiveNavigateTokenized( subtokenized );
                } else {
                    this.addPredicate( tokenized.join(' ') );
                }
            }
            
            let tokenizedPreconditions = PddlAction.tokenize( action.precondition )
            recursiveNavigateTokenized( tokenizedPreconditions )

            let tokenizedEffects = PddlAction.tokenize( action.effect )
            recursiveNavigateTokenized( tokenizedEffects )
    
            this.actions.push(action);
        
        }
        
    }

    saveToFile () {

        var path = './tmp/'+this.name+'.pddl'
        
        return new Promise( (res, rej) => {

            fs.writeFile(path, this.toPddlString(), err => {
                if (err)
                    rej(err)
                else // console.log("File written successfully");
                    res(path)
            })

        })

    }

    toPddlString() {
        return `\
;; domain file: ${this.name}.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        ${this.predicates.map( p => '(' + p + ')' ).join('\n' + PADDING.repeat(2))}              
    )
    ${this.actions.map( a => a.toPddlString()).join('\n' + PADDING.repeat(2)) }
)`
    }

}



// const { LightOn } = desires = require('../lightsworld/lights.desires')
// var lightDomain = new PddlDomain('lights')
// lightDomain.addPredicate(['switched-on', 'l'])
// lightDomain.addPredicate(['switched-off', 'l'])
// lightDomain.addAction(LightOn)
// lightDomain.saveToFile()


