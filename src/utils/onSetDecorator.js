
/**
 * Observer callback function
 * @typedef {function} Observer
 * @param {Observable} observable - Observed which triggered notification
 */
// * @callback Observer
// * @typedef {function(Observable): void} Observer



/**
 * Class member decorators
 * These decorators are applied to a single member of a class. This decorator has properties, methods, getters, and setters. This decorator accepts 3 parameters:  
 * - target: The class to which the member belongs to.
 * - name: Name of the class member.
 * - descriptor: Description of the member which is the object that is passed to Object.defineProperty.
 * 
 * Decorators of classes
 * These decorators are applied to the entire class. These functions are called with a single parameter which is
 * to be decorated. This function is a constructor function. These decorators are not applied to each instance
 * of the class, it only applies to the constructor function. These decorators are less useful than class member
 * decorators. Because we can use a simple function to do everything which can be done by these decorators.
 */
/** @typedef {{value: any, get: function():any, set: function(any):void }} Descriptor Description of the member which is the object that is passed to Object.defineProperty. */



/** @type {function(Class, string, Descriptor): Descriptor} */
function createAttributeSetterDecorator (target, key, descriptor) {
    if ( descriptor.value && typeof descriptor.value != 'function' )
        return {
            get: () => descriptor.value,
            set: (v) => descriptor.value = v
        }
    else
        return descriptor; //unchanged
}

/** @type {function(Observer): function(Class, string, Descriptor): Descriptor} */
function notifyOnSetDecorator (observer) {
    return function (target, key, descriptor) {
        if ( descriptor.set )
            return {
                get: descriptor.get,
                set: function (v) { descriptor.set(v); observer(this); }
            }
        else
            return descriptor; //unchanged
    }
}

/** @type {function(Observer): function(Class, string, Descriptor): Descriptor} */
function createAttributeSetterAndnotifyOnSetDecorator (observer) {
    return function (target, key, descriptor) {
        notifyOnSetDecorator (observer) (target, key, createAttributeSetterDecorator (target, key, descriptor) )
    };
}

function decorateInstanceProperty( instance, key, decorator ) {
    Object.defineProperty( instance, key, decorator( instance, key, Object.getOwnPropertyDescriptor(instance, key) ) )
}

/**
 * DecoratedClass = decorateClassMember( class {  }, key, decorator )
 * @param {Class} cls 
 * @param {string} key 
 * @param {Decorator} decorator 
 * @returns {Class}
 */
function decorateClassMember ( cls, key, decorator ) {
    return class extends cls {
        constructor (...args) {
            super(...args);
            Object.defineProperty( this, key, decorator( cls, key, Object.getOwnPropertyDescriptor(this, key) ) )
        }
    }
}

/**
 * var my = new My(); observeInstanceSetter(my, key, observer)
 * @type {function(Object, string, Observer): void}
 */
function observeInstanceSetter (instance, key, observer) {
    decorateInstanceProperty( instance, key, createAttributeSetterDecorator );
    decorateInstanceProperty( instance, key, notifyOnSetDecorator(observer) );
}


/**
 * observedDecoratedClass = observeClassSetter( class {  }, key, observer )
 * @type {function(Class, string, Observer): void}
 * */
function observeClassSetter (cls, key, observer) {
    return decorateClassMember(
        decorateClassMember(
            cls,
            key,
            createAttributeSetterDecorator),
        key,
        notifyOnSetDecorator(observer)
    )
}

function onSet (x, key, observer) {
    if (typeof(x)=='function')
        return observeClassSetter(x, key, observer);
    else
        return observeInstanceSetter(x, key, observer);

}

module.exports = {onSet, observeInstanceSetter, observeClassSetter}





// /** @type {function(Class): Class} */
// function staticObservable (...keys) {

    
//     // /** @type {function(Class, string, Descriptor): Descriptor} Decorator */
//     // function wrapValueInNotifyAllSetter (target, key, descriptor) {
//     //     if ( !descriptor)
//     //         descriptor = {value: undefined}
//     //     if ( descriptor.value )//&& (typeof descriptor.value) != 'function' )
//     //         return {
//     //             get: () => descriptor.value,
//     //             set: (v) => {
//     //                 if ( v != descriptor.value ) {
//     //                     descriptor.value = v;
//     //                     console.log(this.get)
//     //                     this.notifyAll(key, this);
//     //                 }
//     //             },
//     //             configurable: true
//     //         }
//     //     else
//     //         return descriptor; //unchanged
//     // }

//     // /** @type {function(Class, string, Descriptor): Descriptor} Decorator */
//     // function wrapSetterInStaticNotifyAllSetter (target, key, descriptor) {
//     //     if ( descriptor.set )
//     //         return {
//     //             get: descriptor.get,
//     //             set: function (v) {
//     //                 if ( descriptor.get() != v ) {
//     //                     descriptor.set(v);
//     //                     target.notifyAll(key, this);
//     //                 }
//     //             },
//     //             configurable: true
//     //         }
//     //     else
//     //         return descriptor; //unchanged
//     // }

//     return function (target) {
//         return class Observed extends target {

//             constructor (...args) {
//                 super(...args);
//                 for (const key of keys) {
//                     // var descriptor = Object.getOwnPropertyDescriptor( this, key )
//                     // descriptor = wrapValueInNotifyAllSetter( Tmp, key, descriptor )
//                     // descriptor = wrapSetterInStaticNotifyAllSetter( Tmp, key, descriptor )
//                     // Object.defineProperty( this, key, descriptor );

//                     var descriptor = Object.getOwnPropertyDescriptor(this, key)
//                     if (!descriptor || !descriptor.set) {
//                         var value = descriptor.value;
//                         Object.defineProperty (this, key, {
//                             get: () => value,
//                             set: (v) => {
//                                 if ( v != value ) {
//                                     value = v;
//                                     this.notifyAll(key, this);
//                                 }
//                             },
//                             configurable: true
//                         });
//                     }
                    
//                     descriptor = Object.getOwnPropertyDescriptor(this, key)
//                     Object.defineProperty (this, key, {
//                         get: descriptor.get,
//                         set: (v) => {
//                             if ( descriptor.get() != v ) {
//                                 descriptor.set(v);
//                                 Observed.notifyAll(key, this);
//                             }
//                         },
//                         configurable: true
//                     })
                    
//                 }
//             }

//         }
//     }
// }