


/**
 * https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/
 * By using process.nextTick() we guarantee that apiCall() always runs its callback after the rest of the user's code and before the event loop is allowed to proceed.
 * @function postpone Wrap finallyDo function, accumulate arguments, and call once every nextTick with the complete list of arguments.
 */
class Postponer {

    finallyDo;
    toBeFired = false;
    accumulatedArgs = [];

    constructor ( finallyDo ) {
    
        this.finallyDo = finallyDo;
        this.toBeFired = false;
        this.accumulatedArgs = [];

    }

    async cumulate ( ...args ) {

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if ( ! this.accumulatedArgs[i] ) {
                this.accumulatedArgs.push([]);
                while ( i > 0 && this.accumulatedArgs[i].length + 1 < this.accumulatedArgs[i-1].length ) {
                    this.accumulatedArgs[i].push(undefined);
                }
            }
            this.accumulatedArgs[i].push(arg)
        }

    }

    now ( ...args ) {
        this.cumulate( ...args );
        this.toBeFired = true;
    }

    later () {
        if ( this.toBeFired ) {
            this.toBeFired = false;
            var accumulatedArgsTmp = this.accumulatedArgs;
            this.accumulatedArgs = []
            this.finallyDo( ...accumulatedArgsTmp );
        }
    }

    get atNextTick () {
        return async ( ...args ) => {
            this.now( ...args );
            process.nextTick( ()=>this.later() ) // https://jinoantony.com/blog/setimmediate-vs-process-nexttick-in-nodejs
        }
    }

    get atSetImmediate () {
        return async ( ...args ) => {
            this.now( ...args );
            setImmediate( ()=>this.later() )
        }
    }

    get atSetTimeout () {
        return async ( ...args ) => {
            this.now( ...args );
            setTimeout( ()=>this.later() )
        }
    }
    
}



module.exports = Postponer