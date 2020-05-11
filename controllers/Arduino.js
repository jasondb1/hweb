"use strict";
const ComponentInput = require('./ComponentInput');
const Gpio = require('onoff').Gpio;

const i2c = require('i2c-bus');

// const i2c_bus = i2c.openSync(1);

//i2c comm settings for arduino
let i2c_connected = false;
let DATA_LENGTH = 0x20;
let buffer_arduino = Buffer.alloc(DATA_LENGTH, 0x00);

const modes = {
    OFF : "Off",
    AUTO : "Auto",
    PUMP_MANUAL_ON : "Pump On",
    PUMP_MANUAL_OFF : "Pump Off"
}

const i2c_bus = i2c.open(1, err => {
	if (err) {
		i2c_connected = false;
		throw err;
	}

})

class Arduino extends ComponentInput {

    constructor(slave_address, name = 'arduino', location = "Indoor Garden") {
        super();
        this.slaveAddress = slave_address;
        this.name = name;
        this.location = location;
        this.mode = modes.AUTO;

        this.pin = null;
        this.value = {
            temperature: null,
            humidity: null,
            p_resistor: null,
            lightStatus: null,
            pumpStatus: null,
            mode: null,
        };
    }

    readSensor() {
        
	if (i2c_connected) {
		i2c_bus.i2cReadSync(this.slaveAddress, DATA_LENGTH, buffer_arduino);
        	let string = buffer_arduino.toString();
        	let vals = string.split(/[\s,\0]+/, 3);

        	this.value.p_resistor = vals[0];
        	this.value.temperature = vals[1];
        	this.value.humidity = vals[2];
        	this.value.lightStatus = vals[3];
        	this.value.pumpStatus = vals[4];
        	this.value.mode = vals[5];
        	//console.log(string.split(/[\s,\0]+/, 3));
	} else {
		this.value.temperature = "Sensor Error";
	}

    }

    getTemperature() {
        this.readSensor();
        return this.value.temperature;
    }

    getHumidity() {
        this.readSensor();
        return this.value.humidity;
    }

    getLight() {
        this.readSensor();
        return this.value.p_resistor;
    }

    getmode() {
        return this.value.mode;
    }

    togglePump() {
        //TODO: pump on/off
        //this.value.pumpStatus = true/false;
    }

    toggleLight() {
        //TODO light on/off
        //this.value.pumpStatus = true/false;
    }

    modeStatus() {
	return this.mode;
    }


    setMode(systemMode) {
	this.mode = systemMode;
        buffer_arduino = Buffer.from([systemMode])
        i2c_bus.i2cWriteSync(thi.slaveAddress, 1, buffer_arduino);
    }

}

module.exports = Arduino;
