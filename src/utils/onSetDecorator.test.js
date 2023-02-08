const {onSet, observeInstanceSetter, observeClassSetter} =  require('./onSetDecorator')



test('observeSetter on instance', async () => {
    expect.assertions(1);

    // var p = {name: ''};

    class Person {
        name = "no name";
    }
    var p = new Person();

    onSet(
        p,
        'name',
        observed => expect(observed.name).toBe('marco')
    );

    p.name = 'marco';
});



test('observeSetter on class', async () => {
    expect.assertions(2);

    d = ()=>1;

    Person = onSet(
        class { name = "no name" },
        'name',
        observed => expect(observed.name).toBe('marco')
    )
    
    var p1 = new Person();
    var p2 = new Person();
    p1.name = 'marco';

    expect(p2.name).toBe('no name')
});
