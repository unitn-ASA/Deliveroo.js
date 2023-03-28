import fs from 'fs';
import PddlAction from './PddlAction.js'


const padding = ' '.repeat(4)

export default class PddlDomain {
    
    static nextId = 0;

    name = '';
    predicates = [];
    actions = [];

    /**
     * 
     * @param {string} name 
     * @param {PddlAction} actions 
     */
    constructor ( name = '', ...actions ) {
        
        this.name = 'd' + PddlDomain.nextId++ + name;
        this.addAction(...actions)
        
    }
    
    addPredicate (predicate) { // predicate = ['light-on', 'l']
        if ( this.predicates.find( (e) => e[0]==predicate[0]) )
            return false
        this.predicates.push(predicate)
        predicate.toPddlString = function () {
            return '('+predicate[0]+' ' + predicate.slice(1).map( v => '?'+v ).join(' ') + ')'
        }
        return predicate
    }

    /**
     * 
     * @param {...PddlAction} actions 
     */
    addAction (...actions) {

        for ( let action of actions ) {
            
            for ( let [not,predicate,...args] of action.iterateOnPreconditions() ) {
                this.addPredicate([predicate, ...args])
            }
    
            for ( let [not,predicate,...args] of action.iterateOnEffects() ) {
                this.addPredicate([predicate, ...args])
            }
    
            this.actions.push(action);
        
        }
        
    }

    saveToFile () {

        var path = './tmp/domain-'+this.name+'.pddl'
        
        return new Promise( (res, rej) => {

            fs.writeFile(path, this.content, err => {
                if (err)
                    rej(err)
                else // console.log("File written successfully");
                    res(path)
            })

        })

    }

    get content() {
        return `\
;; domain file: domain-${this.name}.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        ${this.predicates.map( p => p.toPddlString()).join('\n' + padding.repeat(2))}              
    )
    ${this.actions.map( a => a.toPddlString()).join('\n' + padding.repeat(2)) }
)`
    }

}



// const { LightOn } = desires = require('../lightsworld/lights.desires')
// var lightDomain = new PddlDomain('lights')
// lightDomain.addPredicate(['switched-on', 'l'])
// lightDomain.addPredicate(['switched-off', 'l'])
// lightDomain.addAction(LightOn)
// lightDomain.saveToFile()


