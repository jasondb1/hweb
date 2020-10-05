"use strict";
const DEBUG = true;

const dbController = require('./db_sensor.js');

const Led = require('./Led.js');
const GarageRelay = require('./GarageRelay.js');
const Dht22 = require('./Dht22');
const Arduino = require('./Arduino');
const Relay = require('./Relay');
//const Database = require('./database');
//const Database = require('../models/Sequelize.js');
const Temperature = require('./TemperatureControl');


//Set Raspberry Pi pins
const LEDPIN = 4;
const RELAY1PIN = 18;
const RELAY2PIN = 23;
let ARDUINO_I2C_ADDR = 0x08;
const DHT22PIN = 17;

const SAMPLEINTERVAL = 10000; //interval in milliseconds to sample temperature and humidity
const LOGGINGINTERVAL = 30000;

//output components
let indicator = new Led(LEDPIN);
let garageRelay = new GarageRelay(RELAY1PIN);
let relay2 = new Relay(RELAY2PIN);

//input components
let arduino = new Arduino(ARDUINO_I2C_ADDR);
arduino.start(SAMPLEINTERVAL);

let dht22 = new Dht22(DHT22PIN);
let temperatureControl = new Temperature(dht22, relay2, relay2, null);

class ComponentsCtrl {

    constructor(db) {
        this.component = {};
        this.update = null;
        this.updateInterval = null;
        this.database = null;
        this.loggingEnabled = false;
        this.status = {};
        this.database = new dbController(db);
        this.lastLogged = new Date();
    }

    init() {
        //move components to config
        this.component = {
            ledIndicator: {
                obj: indicator,
                value: indicator.value,
                logValue: false
            },

            garageRelay: {
                obj: garageRelay,
                value: garageRelay.value,
                logValue: false
            },

            relay2: {
                obj: relay2,
                value: relay2.value,
                logValue: false
            },

            temp_local: {
                obj: dht22,
                value: dht22.getTemperature(),
                logValue: false
            },

            humidity_local: {
                obj: dht22,
                value: dht22.getHumidity(),
                logValue: false
            },

            hydroponicLightLevel: {
                obj: arduino,
                value: arduino.getLightValue(),
                logValue: false
            },

            hydroponicTemperature: {
                obj: arduino,
                value: arduino.getTemperature(),
                logValue: true
            },

            hydroponicHumidity: {
                obj: arduino,
                value: arduino.getHumidity(),
                logValue: true
            },

            hydroponicReservoirDepth: {
                obj: arduino,
                value: arduino.getReservoirDepth(),
                logValue: true
            },

            hydroponicLightStatus: {
                obj: arduino,
                value: arduino.getLightStatus(),
                logValue: false
            },
            //
            hydroponicPumpStatus: {
                obj: arduino,
                value: arduino.getPumpStatus(),
                logValue: false
            },

            hydroponicMode: {
                obj: arduino,
                value: arduino.getMode(),
                logValue: false
            },

            hydroponicCycleOn: {
                obj: arduino,
                value: arduino.getLightOffSeconds(),
                logValue: false
            },

            hydroponicControl: {
                obj: arduino,
                value: arduino.getValues(),
                logValue: false
            },

            //add arduino toggle light on/off
            //add arduino toggle pump on/off
            //set mode

            temperatureControl: {
                obj: temperatureControl,
                value: temperatureControl.getHeatingTemperature(),
                //fanOff: temperatureControl.fanOff(),
                fanOn: temperatureControl.fanOn(),
                fanAuto: temperatureControl.setFanAuto(),
                clearFanAuto: temperatureControl.clearFanAuto(),
                enableCooling: temperatureControl.enableCooling(),
                enableHeating: () => { temperatureControl.enableHeating() },
                disableHeating: () => { temperatureControl.disableHeating() },
                disableCooling: temperatureControl.disableCooling(),
                temperatureUp: temperatureControl.temperatureUp(),
                temperatureDown: temperatureControl.temperatureDown(),
                runSchedule: temperatureControl.runSchedule(),
                runAuto: temperatureControl.runAuto(),
                //setHold: temperatureControl.setHold(value),
                start: temperatureControl.start(),
                logValue: false

            },

            furnaceStatus: {
                obj: temperatureControl,
                value: temperatureControl.getFurnaceStatus(),
                logValue: false
            },

            heatingTemperature: {
                obj: temperatureControl,
                value: temperatureControl.getHeatingTemperature(),
                logValue: false
            },

            coolingTemperature: {
                obj: temperatureControl,
                value: temperatureControl.getCoolingTemperature(),
                logValue: false
            },

            heatingEnabled: {
                obj: temperatureControl,
                value: temperatureControl.heatingEnabled,
                logValue: false
            },

            coolingEnabled: {
                obj: temperatureControl,
                value: temperatureControl.coolingEnabled,
                logValue: false
            },
            furnaceFanStatus: {
                obj: temperatureControl,
                value: temperatureControl.isFanOn,
                logValue: false
            },

            furnaceFanMode: {
                obj: temperatureControl,
                value: temperatureControl.fanAuto,
                logValue: false
            },

            temperatureHold: {
                obj: temperatureControl,
                value: temperatureControl.hold,
                logValue: false
            },

            //this will need to be the garage door sensor 
            //garageDoor:{
            //
            //}


        };

        this.component.temperatureControl.start;
    }

    //update sensor values and log if enabled
    readAllSensors() {

        //console.log('[ReadAllSensors]:');
        this.updateSensors();

        //console.log(this.status);

        if (this.loggingEnabled) {

            let currentTime = new Date();

            if ((currentTime.getTime() - this.lastLogged.getTime()) > LOGGINGINTERVAL) {
                this.lastLogged = currentTime;

                let keys = Object.keys(this.component);
                let data = [];

                //console.log(keys);

                for (let key of keys) {
                    if (this.status[key] != undefined) {
                        if (this.component[key].logValue) {
                            data.push({
                                description: this.component[key].obj.name,
                                sensor: key,
                                value: this.status[key],
                                //value: this.component.obj.value, //alternate way to read value
                                location: this.component[key].obj.location
                            });
                        }
                    }
                }
                //console.log(this.database);
                //this.database.sensor.insert(data);
                //console.log('data-');
                //console.log(data);

                this.database.insert(data);
            }
        }
    }

    //enable data logging
    enableLogging() {
        this.loggingEnabled = true;
    }

    //get the current status of each component
    updateSensors() {

        //console.log("update log");
        this.init();

        this.status.ts = new Date().getTime();

        let keys = Object.keys(this.component);

        for (let key of keys) {
            this.status[key] = this.component[key].value;
        }

        if (DEBUG) {
            //console.log("update current status");
            //console.log(this.status);
        }

        return this.status;
    }

    // returns the current status of the sensors
    currentStatus() {
        return this.status;
    }

    //update an individual component
    updateComponentStatus(comp) {
        this.status[comp] = this.component[comp].value;
    }

    //start sampling sensors at specified interval
    start(interval = SAMPLEINTERVAL) {
        this.updateInterval = interval;
        this.update = setInterval(
            this.readAllSensors.bind(this), (this.updateInterval));
    }

    //stop sampling sensors
    stop() {
        clearInterval(this.update);
    }

}

module.exports = ComponentsCtrl;