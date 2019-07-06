"use strict";
const ComponentOutput = require('./ComponentOutput');
const Gpio = require('onoff').Gpio;
const HOLDOPEN = 1000; //time to hold relay open

class GarageRelay extends ComponentOutput {

    constructor(pin_number, name = 'garage relay', location = "garage", lowOn = true) {
        super();
        this.pinNumber = pin_number;
        this.name = name;
        this.location = location;
        this.lowOn = lowOn;

        this.pin = new Gpio(this.pinNumber, 'out');
        this.value = this.pin.readSync();

        this.open.bind(this);
        this.close.bind(this);
    }

    open(){
        this.on();
        //Keep relay engaged for set time
        setTimeout(this.off, HOLDOPEN);
    }

    close(){
        this.on();
        //Keep relay engaged for set time
        setTimeout(this.off, HOLDOPEN);
    }

}

module.exports = GarageRelay;
