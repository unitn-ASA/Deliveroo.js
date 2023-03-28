const Beliefset = require('./Beliefset')

describe('declare()', () => {
    var b = new Beliefset()
    test('declare() returns true', () => {
        expect(b.declare('on l1')).toBe(true);
    });
    test('re declare() at same value returns false', () => {
        expect(b.declare('on l1')).toBe(false);
    });
    test('fact.value is true', () => {
        expect(b['on l1']).toBe(true);
    });
    test('objects include args of declared fact', () => {
        expect(b.objects[0]).toBe('l1');
        expect(b.objects.length).toBe(1);
    });
})

describe('observe fact', () => {
    var b = new Beliefset()

    var notified = false
    var obs = value => {notified = true}
    b.observe('on', obs)

    test('fact initial value is undefined', () => {
        expect(b['on']).toBe(undefined);
    });

    test('declare() returns true', () => {
        expect(b.declare('on')).toBe(true);
    });

    test('fact final value is true', () => {
        expect(b['on']).toBe(true);
    });

    test('observer get notified in case of a change to the fact', () => {
        expect(notified).toBe(true);
    });
})

describe('unobserve fact', () => {
    var b = new Beliefset()

    var notified = false
    var obs = (fact, value) => {notified = true}
    b.observe(obs, 'on')
    b.unobserve(obs, 'on')

    test('declare() returns true', () => {
        expect(b.declare('on')).toBe(true);
    });

    test('observer is not notified in case of a change to the fact', () => {
        expect(notified).toBe(false);
    });
})

describe('literals', () => {
    var b = new Beliefset()

    test('apply(\'on\', \'in_room\')', () => {
        b.apply('on', 'in_room')
        expect(b['on']).toBe(true);
        expect(b['in_room']).toBe(true);
    });

    test('apply(\'not on\')', () => {
        b.apply('not on')
        expect(b['on']).toBe(false);
    });

    test('get literals includes \'not on\'', () => {
        expect(b.literals[0]).toBe('not on');
        expect(b.literals).toEqual(['not on', 'in_room']);
    });

    test('check(\'not on\') toBe(true)', () => {
        expect(b.check('not on')).toBe(true);
        expect(b.check('in_room')).toBe(true);
        expect(b.check('not on', 'in_room')).toBe(true);
    });

    test('check(\'on\') toBe(false)', () => {
        expect(b.check('on', 'in_room')).toBe(false);
    });
})