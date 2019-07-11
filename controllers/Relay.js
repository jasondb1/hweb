"use strict";
const ComponentOutput = require('./ComponentOutput');
const Gpio = require('onoff').Gpio;

class Relay extends ComponentOutput {

    constructor(pin_number, name = 'relay', location = "unknown", lowOn = true) {
        super();
        this.pinNumber = pin_number;
        this.name = name;
        this.location = location;
        this.lowOn = lowOn;

        this.pin = new Gpio(this.pinNumber, 'out');
        
        //default is closed
        this.pin.writeSync(1);
        
        this.value = this.pin.readSync();

        this.open.bind(this);
        this.close.bind(this);
    }

    open(){
        this.on();
    }

    close(){
        this.on();
    }

}

module.exports = Relay;
