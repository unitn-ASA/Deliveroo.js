const {Observable, staticObservable} =  require('./Observable')

// class Person {
//     public = "undef public";
//     #name = "no name";
//     getName () {return this.#name} 
//     setName (n) {this.#name = n} 
// }
// p=new Person()
// Object.getOwnPropertyDescriptor(p, 'public') //-> {value: 'undef public', writable: true, enumerable: true, configurable: true}
// Object.getOwnPropertyDescriptor(p, '#name') //-> undefined

test('Observable', async () => {
    expect.assertions(1);

    var Person = staticObservable ('name') ( class extends Observable {
        name = "no name";
        getName () {return this.name} 
        setName (n) {this.name = n} 
    })
    p = new Person()
    // p.makeObservable('name');
    p.observe('name', obs => expect(obs.getName()).toBe( 'marco' ) )
    p.setName('marco');

});

test('staticObservable', async () => {
    expect.assertions(2);

    var Person = staticObservable ('name') ( class extends Observable {
        // @observableAttribute
        name = "no name";
    })
    p1 = new Person()
    p2 = new Person()
    Person.observe('name', obs => expect(obs.name).toBe( 'marco' ) )
    p1.name = 'marco';
    p2.name = 'marco';

});

// test('Observable => observers are called back as microtask after current pending Promises', async () => {

//     var o1 = new Observable( 'name' )
//     Promise.resolve().then( () => expect(o1.get()).toBe( 'final_name' ) )
//     o1.set('bob')
//     o1.set('final_name')

// });

// test('Observable => onceChanged', async () => {

//     var name = new Observable( 'name' )
//     name.onceChanged().then( (o) => expect(o.get()).toBe( 'bob' ) );
//     name.set('no_name')
//     name.set('bob')
// });

// test('Observable => Promise.any', async () => {
//     expect.assertions(2);

//     var name = new Observable( 'name' )
//     var surname = new Observable( 'surname' )
//     // var op = { name: name.onceChanged(), surname: surname.onceChanged() }
//     // Promise.any(Object.values(op)]).then( (o) => expect(o).toBe(name) );
//     Promise.any([name, surname]).then( (o) => {expect(o).toBe(name); expect(o.get()).toBe('bob')} );
//     name.set('no_name')
//     name.set('bob')

// });




