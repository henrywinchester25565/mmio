//DESC: FOR EVENT HANDLING - DRAWING ON CODE FROM NODE'S EVENT EMITTER
'use strict';

//NOTES
//Use 'on', 'once' and 'emit' to keep similar to socket.io
//Adds events to events object in arrays, and calls sequentially

//LOADED
console.log('Loaded: events.js');

class EventHandler {

    constructor () {
        this.events = {};
    }


    //Add event listener
    on (event, callback) {
        //Add event to events object
        if (this.events[event] !== undefined) {
            this.events[event].push(callback);
        }
        else {
            this.events[event] = [callback];
        }
    }

    //Add one-shot event listener
    once (event, callback) {
        callback.once = true;
        this.on(event, callback);
    }

    //Call event
    emit (event, ...args) {
        //Call callbacks and remove one-shots
        if (this.events[event] !== undefined) {
            let callbacks = this.events[event];
            for (let i = 0; i < callbacks.length; i++) {
                let callback = callbacks[i];
                callback.apply(null, args);
                if (callback.once) {

                }
            }
        }
    }

    //Remove callback from event
    remove (event, callback) {
        if (this.events[event] !== undefined) {
            let callbacks = this.events[event];
            let index = callbacks.indexOf(callback);
            if (index > -1) {
                //Remove callback
                callbacks.splice(index, -1);
            }
            if (callbacks.length <= 0) {
                //Delete event
                delete this.events[event];
            }
        }
    }

}

//EXPORTS
exports.handler = EventHandler;