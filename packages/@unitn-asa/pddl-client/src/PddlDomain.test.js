const fs = require('fs')
const PddlDomain = require('./PddlDomain')
const Goal = require('../bdi/Goal')



// var blocksworldDomain = new PddlDomain('blocksworld')
// blocksworldDomain.addPredicate(['clear', 'x'])
// blocksworldDomain.addPredicate(['on-table', 'x'])
// blocksworldDomain.addPredicate(['holding', 'x'])
// blocksworldDomain.addPredicate(['on', 'x' ,'y'])
// blocksworldDomain.addPredicate(['empty'])
// blocksworldDomain.addAction(PickUp)
// blocksworldDomain.addAction(PutDown)
// blocksworldDomain.addAction(Stack)
// blocksworldDomain.addAction(UnStack)
// blocksworldDomain.saveToFile()



describe('addPredicate()', () => {
    var lightDomain = new PddlDomain('lights')
    var predicate = ['switched-on', 'l', 'll']
    test('addPredicate should return predicate itself', () => {
        expect(lightDomain.addPredicate(predicate)).toBe(predicate);
    });
    test('toPddlString() should return pddl form with question mark', () => {
        expect(lightDomain.predicates[0].toPddlString()).toBe('(switched-on ?l ?ll)');
    });
})



describe('addAction()', () => {
    var lightDomain = new PddlDomain('lights')
    
    class LightOn extends Goal {
        static parameters = ['l']
        static precondition = [ ['switched', 'l'] ]
        static effect = [ ['switched-on', 'l'], ['not switched-off', 'l'] ]
    }
    
    lightDomain.addAction(LightOn)

    test('precondition should be added as pddl predicate', () => {
        expect(JSON.stringify(lightDomain.predicates[0])).toMatch(JSON.stringify(['switched', 'l']));
    });

    test('effect should be added as pddl predicate', () => {
        expect(JSON.stringify(lightDomain.predicates[1])).toEqual(JSON.stringify(['switched-on', 'l']));
    });

    test('not effect should be added as pddl predicate', () => {
        expect(JSON.stringify(lightDomain.predicates[2])).toEqual(JSON.stringify(['switched-off', 'l']));
    });

    test('toPddlString() should return pddl form with question mark', () => {
        expect(lightDomain.actions[0].toPddlString()).toBe(`
        (:action LightOn
            :parameters (?l)
            :precondition (and (switched ?l) )
            :effect (and
                (switched-on ?l)\n\t\t\t(not (switched-off ?l))
            )
        )`
        );
    });

})