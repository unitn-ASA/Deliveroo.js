const Agent = require('../../bdi/Agent')
const PlanningGoal =  require('./PlanningGoal')
const PlanningIntention =  require('./PlanningIntention')


    
describe('PlanningIntention', () => {

    class SwitchOnLight extends PlanningIntention {
    
        static parameters = ['l']
        static precondition = [ ['switched-off', 'l'] ]
        static effect = [ ['switched-on', 'l'], ['not switched-off', 'l'] ]
        
        static applicable (goal) {
            return ( goal instanceof PlanningGoal && goal.parameters.hasOwnProperty('l') )
        }
        
        *exec () {
            yield this.applyEffect()
        }
    
    }

    test('SwitchOnLight.applicable(new PlanningGoal({l:l1}))', async () => {
        var g1 = new PlanningGoal({l:'l1'})
        expect( SwitchOnLight.applicable(g1) ).toBe(true)
    });

    test('run() should apply effects', async () => {
        var a1 = new Agent('a1')
        var g1 = new PlanningGoal({l:'l1'})
        var i1 = new SwitchOnLight(a1, g1)

        expect( i1.checkPrecondition() ).toBe(false);
        a1.beliefs.declare('switched-off l1')
        expect( i1.checkPrecondition() ).toBe(true);

        expect( i1.checkEffect() ).toBe(false);
        expect( a1.beliefs['switched-on l1'] ).toBe(undefined);

        expect( await i1.run() ).toBe(true);
        
        expect( i1.checkEffect() ).toBe(true);
        expect( a1.beliefs['switched-on l1'] ).toBe(true);
    });

})
