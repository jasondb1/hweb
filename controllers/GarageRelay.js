"use strict";
const ComponentOutput = require('./ComponentOutput');
const Gpio = require('onoff').Gpio;
const HOLDOPEN = 1000; //time to hold relay close

class GarageRelay extends ComponentOutput {

    constructor(pin_number, name = 'garage relay', location = "garage", lowOn = true) {
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
        //Keep relay engaged for set time
        setTimeout(this.off.bind(this), HOLDOPEN);
    }

    close(){
        this.on();
        //Keep relay engaged for set time
        setTimeout(this.off.bind(this), HOLDOPEN);
    }

}

module.exports = GarageRelay;
