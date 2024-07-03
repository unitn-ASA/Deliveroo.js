import fs from 'fs';



export default class PddlProblem {
    
    static nextId = 0;

    constructor (name, objects, init, goal) {
        this.name = 'problem-' + name + '-' + PddlProblem.nextId++;
        this.objects = objects;
        this.inits = init;
        this.goals = goal;
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
;; problem file: ${this.name}.pddl
(define (problem default)
    (:domain default)
    (:objects ${this.objects})
    (:init ${this.inits})
    (:goal (${this.goals}))
)
`
    }

}



// var lightProblem = new PddlProblem( 'lights', 'light1 light2', '(switched-off light1) (switched-off light2)', 'switched-on light1' )
