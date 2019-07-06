"use strict";
const ComponentOutput = require('./ComponentOutput');
//import ComponentOutput from './ComponentOutput';

const Gpio = require('onoff').Gpio;

class Led extends ComponentOutput {
    //log = null;

    constructor(pin_number, name = 'led', location = "unknown") {
        super();
        this.pinNumber = pin_number;
        this.name = name;
        this.location = location;

        this.pin = new Gpio(this.pinNumber, 'out');
        this.value = this.pin.readSync();
    }

};

module.exports = Led;
