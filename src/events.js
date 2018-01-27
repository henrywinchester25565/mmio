//DESC: FOR EVENT HANDLING - DRAWING ON CODE FROM NODE'S EVENT EMITTER
'use strict';

//NOTES
//Use 'on', 'once' and 'emit' to keep similar to socket.io
//Adds events to events object in arrays, and calls sequentially

//LOADED
console.log('Loaded: events.js');

//REQUIREMENTS
const $ARRAY = require('./general.js').array;

//FUNCTIONALITY
//Kept out of class to hide when used.
const _addEventListener = function (target, event, callback) {
    //If event already exists
    if (target.events[event] !== undefined) {
        target.events[event].push(callback);
    }
    //Else...
    else {
        target.events[event] = [callback];
    }
    //console.log(target.events[event]);
};

const _removeEventListener = function (target, event, callback) {
    if (target.events[event] !== undefined) {
        $ARRAY.rmv(target.events[event], callback);
        if (target.events[event].length <= 0) {
            delete target.events[event]; //Delete if event not in use
        }
    }
    //console.log(target.events[event]);
};

const _callEvents = function (event, ...args) {
    if (this.events[event] !== undefined) {
        let callbacks = this.events[event];
        //console.log(callbacks);
        for (let i = 0; i < callbacks.length; i++) {
            //console.log(i);
            let callback = callbacks[i];
            //delete if one-shot
            callback.apply(null, args);
            if (callback.once) {
                _removeEventListener(this, event, callback);
                i--;
            }
        }
    }
};

//EVENT HANDLER
class EventHandler {

    constructor () {
        this.events = {};
    }

    on (event, callback) {
        callback.once = false;
        _addEventListener(this, event, callback);
    }

    once (event, callback) {
        callback.once = true;
        _addEventListener(this, event, callback);
    }

    emit () {
        _callEvents.apply(this, arguments);
    }

}

//EXPORTS
exports.handler = EventHandler;