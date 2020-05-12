"use strict";
const ComponentInput = require('./ComponentInput');
const Gpio = require('onoff').Gpio;
let i2c_connected = false;

const i2c = require('i2c-bus');
// const i2c_bus = i2c.openSync(1);
const i2c_bus = i2c.open(1, err => {

    if (err) {
	console.log("Error opening arduino");
	//throw err;
    } else {
	i2c_connected = true;
	console.log("Connected");
    }


  });


//i2c comm settings for arduino
let DATA_LENGTH = 0x20;
let buffer_arduino = Buffer.alloc(DATA_LENGTH, 0x00);

//const modes = {
//	OFF : "Off",
//    AUTO : "Auto",
//    PUMP_MANUAL_ON : "Pump On",
//    PUMP_MANUAL_OFF : "Pump Off"
//}


class Arduino extends ComponentInput {

    constructor(slave_address, name = 'arduino', location = "Indoor Garden") {
        super();
        this.slaveAddress = slave_address;
        this.name = name;
        this.location = location;
        this.mode = 1;

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
        //i2c_bus.i2cReadSync(this.slaveAddress, DATA_LENGTH, buffer_arduino);
    let buffer_arduino = Buffer.alloc(DATA_LENGTH, 0x00);
        
	i2c_bus.i2cRead(this.slaveAddress, DATA_LENGTH, buffer_arduino, (err, rawData) => {
		console.log(rawData);
	    if (!err) {
	        let string = rawData
                let vals = string.split(/[\s,\0]+/, 3);

                this.value.p_resistor = vals[0];
                this.value.temperature = vals[1];
                this.value.humidity = vals[2];
		this.value.mode = vals[3]; //TODO: edit the arduino code to ensure this    
	    } else {
		this.value.p_resistor = 0;
		this.value.temperature = 0;
		this.value.humidity = 0;    
	    }

	});
	    
	//let string = buffer_arduino.toString();
        //console.log(string.split(/[\s,\0]+/, 3));
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

    setMode(systemMode) {
        buffer_arduino = Buffer.from([systemMode])
        if (i2c_connected) {
	    i2c_bus.i2cWrite(this.slaveAddress, 1, buffer_arduino, err => {
	    	console.log("Arduino Error: check connection");
	    });
	}
	this.value.mode = systemMode;
    }

    modeStatus() {
        return this.value.mode;
    }

}

module.exports = Arduino;
