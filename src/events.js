//DESC: FOR EVENT HANDLING - DRAWING ON CODE FROM NODE'S EVENT EMITTER
'use strict';

//NOTES
//Use 'on' and 'emit' to keep similar to socket.io
//Adds events to events object in arrays, and calls sequentially

//LOADED
console.log('Loaded: events.js');

//REQUIREMENTS
const $ARRAY = require('./general.js').array;

//FUNCTIONALITY
const _addEventListener = function (target, event, callback) {
    //If event already exists
    if (target.events[event] !== undefined) {
        target.events[event].push(callback);
    }
    //Else...
    else {
        target.events[event] = [callback];
    }
};

const _removeEventListener = function (target, event, callback) {
    if (target.events[event] !== undefined) {
        $ARRAY.rmv(target.events[event], callback);
        if (target.events[event].length <= 0) {
            delete target.events[event]; //Delete if event not in use
        }
    }
};

const _callEvents = function (target, event) {
    if (target.events[event] !== undefined) {
        for (let i = 0; i < target.events[event].length; i++) {
            let callback = target.events[event][i];
            if (callback.once) {
                _removeEventListener(target, event, callback);
            }
            callback();
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

    emit (event) {
        _callEvents(this, event);
    }

}

//EXPORTS
exports.handler = EventHandler;