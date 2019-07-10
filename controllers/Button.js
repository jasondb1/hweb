"use strict";
const ComponentInput = require('./ComponentInput');
const Gpio = require('onoff').Gpio;

class Led extends ComponentInput {

    constructor(pin_number, name = 'button', location = "unknown") {
        super();
        this.pinNumber = pin_number;
        this.name = name;
        this.location = location;

        this.pin = new Gpio(this.pinNumber, 'in');
        this.value = this.pin.readSync();
    }
}




module.exports = Led;
