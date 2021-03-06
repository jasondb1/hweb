"use strict";
const ComponentOutput = require('./ComponentOutput');
const Gpio = require('onoff').Gpio;

class Led extends ComponentOutput {

    constructor(pin_number, name = 'led', location = "unknown") {
        super();
        this.pinNumber = pin_number;
        this.name = name;
        this.location = location;

        //this.pin = new Gpio(this.pinNumber, 'out');
        this.pin = new Gpio(pin_number, 'out');
        this.value = this.pin.readSync();
    }

}

module.exports = Led;
