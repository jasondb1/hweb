"use strict";
const ComponentInput = require('./ComponentInput');
const Gpio = require('onoff').Gpio;
let i2c_connected = false;
const DEBUG = false;

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

//const READINTERVAL = 5000; //limit read to every 5 seconds
const SAMPLEINTERVAL = 10000; //interval in seconds to sample temperature and humidity

class Arduino extends ComponentInput {

    constructor(slave_address, name = 'arduino', location = "Indoor Garden") {
        super();
        this.slaveAddress = slave_address;
        this.name = name;
        this.location = location;
        this.mode = 1;
        this.lastRead = Date.now() - 5000; //ensure sensor is read right away
        this.updateInterval = SAMPLEINTERVAL;
        this.update = null;

        this.pin = null;
        this.value = {
            temperature: null,
            humidity: null,
            p_resistor: null,
            lightStatus: null,
            pumpStatus: null,
            mode: null,
            secondsToLightOnOff: 0,
            reservoirDepth: null,
        };

        this.readSensor.bind(this);
    }

    readSensor() {
        //if (Date.now() > (this.lastRead + READINTERVAL)) {
        if (true) {
            if (DEBUG) console.log("reading sensor");
            buffer_arduino = Buffer.alloc(DATA_LENGTH, 0x00);

            i2c_bus.i2cRead(this.slaveAddress, DATA_LENGTH, buffer_arduino, (err, rawData) => {
                if (DEBUG) console.log("---Arduino Data");
                if (DEBUG) console.log(buffer_arduino);
                if (!err) {

                    //parse input from arduino
                    let string = buffer_arduino.toString('utf-8');
                    //console.log("String:" + string);

                    this.value.p_resistor = buffer_arduino.readInt16BE(0);

                    //check if temperatures are valid
                    //TODO: this may be able to be removed if filtering is done on arduino
                    let val = (buffer_arduino.readInt16BE(2)) / 10; 
                    if ((val > -50 && val < 150) && val != 0 ) {
                        this.value.temperature = val;
                    }

                    //TODO: this may be able to be removed if filtering is done on arduino                                            
                    //val = (buffer_arduino.readInt16BE(4)) / 10;
                    val = (buffer_arduino.readInt16BE(4));
                    if (val > 0 && val < 150) {
                        this.value.humidity = val;
                    }

                    this.value.secondsToLightOnOff = (buffer_arduino.readUInt16BE(6) * 60);
                    this.value.lightDuration = (buffer_arduino.readUInt16BE(8));
                    this.value.floodInterval = (buffer_arduino.readUInt16BE(10));
                    this.value.floodDuration = (buffer_arduino.readUInt16BE(12));
                    this.value.mode = buffer_arduino.readUInt8(14);
                    this.value.lightStatus = buffer_arduino.readUInt8(15);
                    this.value.pumpStatus = buffer_arduino.readUInt8(16);

                  val = buffer_arduino.readUInt16BE(17);
                    if (val < 4500) {
                        this.value.reservoirDepth = val;
                    }

                    if (DEBUG) console.log("received from arduino:");
                    if (DEBUG) console.log(this.value);
                    if (DEBUG) console.log("Finished reading from arduino");

                } else {
                    console.log("error reading arduino");
                    //this.value.p_resistor = -99;
                    //this.value.temperature = -99;
                    //this.value.humidity = -99;
                    //this.value.mode = -99;
                    //this.value.pumpStatus = -99;
                    //this.value.lightStatus = -99;
                }
            });

            this.lastRead = Date.now();

            //console.log("this.value:")
            //console.log(this.value);
            //console.log("end data request");   
        }
    }

    getValues() {
        //this.readSensor();
        return this.value;
    }

    getTemperature() {
        return this.value.temperature;
    }

    getReservoirDepth() {
        return this.value.reservoirDepth;
    }

    getHumidity() {
        return this.value.humidity;
    }

    getLightValue() {
        return this.value.p_resistor;
    }

    getMode() {
        return this.value.mode;
    }

    getLightStatus() {
        return this.value.lightStatus;
    }

    getPumpStatus() {
        return this.value.pumpStatus;
    }

    getLightOffSeconds() {
        return this.value.secondsToLightOnOff;
    }

    getMode() {
        return this.value.mode;
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
        this.readSensor();
    }

    sendCommand(command) {
        buffer_arduino = Buffer.from([command])
        if (i2c_connected) {
            i2c_bus.i2cWrite(this.slaveAddress, 1, buffer_arduino, err => {
                if (err) {
                    console.log("Arduino Error: check connection");
                }
            });
        }
        this.readSensor();
    }

    //start sampling sensors at specified interval
    start(interval = SAMPLEINTERVAL) {
        this.updateInterval = interval;
        this.update = setInterval(
            this.readSensor.bind(this), (this.updateInterval));
    }

    //stop sampling sensors
    stop() {
        clearInterval(this.update);
    }

}

module.exports = Arduino;