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
	console.log("Arduino Connected");
    }
  });


//i2c comm settings for arduino
let DATA_LENGTH = 0x20;
let buffer_arduino = Buffer.alloc(DATA_LENGTH, 0x00);

const READINTERVAL = 5000; //limit read to every 5 seconds

class Arduino extends ComponentInput {

    constructor(slave_address, name = 'arduino', location = "Indoor Garden") {
        super();
        this.slaveAddress = slave_address;
        this.name = name;
        this.location = location;
        this.mode = 1;
        this.lastRead = Date.now() - 5000; //ensure sensor is read right away

        this.pin = null;
        this.value = {
            temperature: null,
            humidity: null,
            p_resistor: null,
            lightStatus: null,
            pumpStatus: null,
            mode: null,
            secondsToLightOff: 0,
        };
    }

    readSensor() {
        if (Date.now() > (this.lastRead + READINTERVAL)){

            buffer_arduino = Buffer.alloc(DATA_LENGTH, 0x00);

            i2c_bus.i2cRead(this.slaveAddress, DATA_LENGTH, buffer_arduino, (err, rawData) => {
                //console.log("---Arduino Data");
                //console.log(buffer_arduino);
	            if (!err) {
                    let string = buffer_arduino.toString('utf-8');
                    //console.log("String:" + string);
                    
                    
                    this.value.p_resistor = buffer_arduino.readInt16BE(0);
                    
                    //check if temperatures are valid
                    let val = (buffer_arduino.readInt16BE(2)) / 100;
                    if (val > -99 && val < 150){
                        this.value.temperature = val;
                    }

                    //check for valid humidity values                                               
                    val = (buffer_arduino.readInt16BE(4)) / 10;
                    if (val > -1 && val < 150){
                        this.value.humidity = val;
                    }
                        
                    this.value.mode = buffer_arduino.readUInt8(22);    
                    this.value.lightStatus = buffer_arduino.readUInt8(23);
                    this.value.pumpStatus = buffer_arduino.readUInt8(24);
                    this.value.secondsToLightOff = (buffer_arduino.readUInt32BE(6)/1000 );
                    this.value.lightDuration = (buffer_arduino.readUInt32BE(10) );
                    this.value.floodInterval = (buffer_arduino.readUInt32BE(14) );
                    this.value.floodDuration = (buffer_arduino.readUInt32BE(18) );
                    
                    //console.log(this.value);
                        
	            } else {
		            //this.value.p_resistor = -99;
		            //this.value.temperature = -99;
		            //this.value.humidity = -99;
                    this.value.mode = -99;
                    this.value.pumpStatus = -99;
                    this.value.lightStatus = -99;
	            }
            });

        this.lastRead = Date.now();
        //console.log("end data request");   
        }
    }

    getValues() {
        this.readSensor();
        return this.value;
    }
        
    getTemperature() {
        this.readSensor();
        return this.value.temperature;
    }

    getHumidity() {
        this.readSensor();
        return this.value.humidity;
    }

    getLightValue() {
        this.readSensor();
        return this.value.p_resistor;
    }

    getMode() {
        this.readSensor();
        return this.value.mode;
    }

    getLightStatus(){
        this.readSensor();
        return this.value.lightStatus;
    }

    getPumpStatus(){
        this.readSensor();
        return this.value.pumpStatus;
    }

    getLightOffSeconds(){
        this.readSensor();
        return this.value.secondsToLightOff;
    }

    setMode(systemMode) {
        buffer_arduino = Buffer.from([systemMode])
        if (i2c_connected) {
	        i2c_bus.i2cWrite(this.slaveAddress, 1, buffer_arduino, err => {
	    	    if (err) {
                    console.log("Arduino Error: check connection");
                }
	        });
	    }
	    this.value.mode = systemMode;
    }

    sendCommand(command) {
        buffer_arduino = Buffer.from([command])
        if (i2c_connected) {
	        i2c_bus.i2cWrite(this.slaveAddress, 1, buffer_arduino, err => {
	    	    if (err){
                    console.log("Arduino Error: check connection");
                }
	        });
	    }
    }

    getMode() {
        return this.value.mode;
    }

}

module.exports = Arduino;
