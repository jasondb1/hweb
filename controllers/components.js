"use strict";
const Led = require('./Led.js');
const GarageRelay = require('./GarageRelay.js');
const Dht22 = require('./Dht22');
const Arduino = require('./Arduino');
const Relay = require('./Relay');
const Database = require('./database');
const Temperature = require('./TemperatureControl');

//Set Raspberry Pi pins
const LEDPIN = 4;
const RELAY1PIN = 18;
const RELAY2PIN = 23;
let ARDUINO_I2C_ADDR = 0x08;
const DHT22PIN = 17;

const SAMPLEINTERVAL = 10; //interval in seconds to sample temperature and humidity

//output components
let indicator = new Led(LEDPIN);
let garageRelay = new GarageRelay(RELAY1PIN);
let relay2 = new Relay(RELAY2PIN);

//input components
let arduino = new Arduino(ARDUINO_I2C_ADDR);
let dht22 = new Dht22(DHT22PIN);
let temperatureControl = new Temperature(dht22, relay2, relay2, null);

class ComponentsCtrl {

    constructor() {
        this.component = {};
        this.update = null;
        this.updateInterval = null;
        this.database = null;
        this.loggingEnabled = false;
        this.status = {};
    }

    init() {
        this.component = {
            ledIndicator: {obj: indicator,
                            value: indicator.value },
        
            garageRelay: { obj: garageRelay,
                            value: garageRelay.value },

            relay2: { obj: relay2,
                            value: relay2.value },
            
            temp_local: { obj: dht22,
                value: dht22.getTemperature() },

            humidity_local: { obj: dht22,
                value: dht22.getHumidity() },

            presistor_remote0: { obj: arduino,
                value: arduino.getLight() },

            temp_remote0: { obj: arduino,
                value: arduino.getTemperature() },

            humidity_remote0: { obj: arduino,
                value: arduino.getHumidity() },

            temperatureControl: { obj: temperatureControl,
                value: temperatureControl.getHeatingTemperature(),
                //fanOff: temperatureControl.fanOff(),
                fanOn: temperatureControl.fanOn(),
                fanAuto: temperatureControl.setFanAuto(),
                clearFanAuto: temperatureControl.clearFanAuto(),
                enableCooling: temperatureControl.enableCooling(),
                enableHeating: temperatureControl.enableHeating(),
                disableHeating: temperatureControl.disableHeating(),
                disableCooling: temperatureControl.disableCooling(),
                temperatureUp: temperatureControl.temperatureUp(),
                temperatureDown: temperatureControl.temperatureDown(),
                runSchedule: temperatureControl.runSchedule(),
                runAuto: temperatureControl.runAuto(),
                setHold: temperatureControl.setHold(value),
                start: temperatureControl.start(),

            },

            furnaceStatus: { obj: temperatureControl,
                value: temperatureControl.getFurnaceStatus(), },

            heatingTemperature: { obj: temperatureControl,
                value: temperatureControl.getHeatingTemperature(), },

            coolingTemperature: { obj: temperatureControl,
                value: temperatureControl.getCoolingTemperature(), },

            heatingEnabled: { obj: temperatureControl,
                value: temperatureControl.heatingEnabled, },

            coolingEnabled: { obj: temperatureControl,
                value: temperatureControl.coolingEnabled, },

            furnaceFan: { obj: temperatureControl,
                value: temperatureControl.isFanOn, },

            furnaceFanStatus: { obj: temperatureControl,
                value: temperatureControl.fanAuto, },

            temperatureHold: { obj: temperatureControl,
                value: temperatureControl.hold,
            }


        };

        this.component.temperatureControl.start();
    }

    readAllSensors() {

        this.currentStatus();

        if (this.loggingEnabled) {
            //close database
            //let log_sensors = ['temp_local', 'humidity_local', 'temp_remote0', 'humidity_remote0', 'presistor_remote0', 'ledIndicator', 'garageRelay', 'relay2'];
            let keys = Object.keys(this.component);
            let data = [];

            for (let key of keys) {
                data.push({
                    description: this.component[key].name,
                    sensor: key,
                    value: this.component[key].value,
                    location: this.component[key].value
                });
            }
            this.database.insert(data);
        }
    }

    enableLogging() {
        this.loggingEnabled = true;
        this.database = new Database();
    }

    currentStatus() {
        this.init();
        this.status.ts = new Date().getTime();

        //let keys = ['temp_local', 'humidity_local', 'temp_remote0', 'humidity_remote0', 'presistor_remote0', 'ledIndicator', 'garageRelay', 'relay2', 'temperatureControl'];
        let keys = Object.keys(this.component);

        for (let key of keys) {
            this.status[key] = this.component[key].value;
        }
        return this.status;
    }

    updateComponentStatus(comp) {
        this.status[comp] = this.component[key].value;
    }

    start(interval = SAMPLEINTERVAL) {
        this.updateInterval = interval;
        this.update = setInterval(
            this.readAllSensors.bind(this)
            , (this.updateInterval * 1000));
    }

    stop() {
        clearInterval(this.update);
    }

}

module.exports = ComponentsCtrl;
