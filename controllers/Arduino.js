"use strict";
const ComponentInput = require('./ComponentInput');
const Gpio = require('onoff').Gpio;

const i2c = require('i2c-bus');
const i2c_bus = i2c.openSync(1);

//i2c comm settings for arduino
let DATA_LENGTH = 0x20;
let buffer_arduino = Buffer.alloc(DATA_LENGTH, 0x00);


class Arduino extends ComponentInput {

    constructor(slave_address, name = 'arduino', location = "unknown") {
        super();
        this.slaveAddress = slave_address;
        this.name = name;
        this.location = location;

        this.pin = null;
        this.value = {};
    }

    readSensor() {
        console.log('arduino get temp');
        i2c_bus.i2cReadSync(this.slaveAddress, DATA_LENGTH, buffer_arduino);
        let string = buffer_arduino.toString();
        let vals = string.split(/[\s,\0]+/, 3);
        //console.log(vals);

        this.value.presistor = vals[0];
        this.value.temp = vals[1];
        this.value.humidity = vals[2];
        console.log(string.split(/[\s,\0]+/, 3));
    }

    getTemperature() {
        console.log('arduino get temp');
        this.readSensor.bind(this);
        return this.value.temperature;
    }

    getHumidity() {
        this.readSensor.bind(this);
        return this.value.humidity;
    }

    getLight() {
        this.readSensor.bind(this);
        return this.value.presistor;
    }

}


module.exports = Arduino;
