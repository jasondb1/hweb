"use strict";
const Led = require('./Led.js');
const GarageRelay = require('./GarageRelay.js');
const Dht22 = require('./Dht22');
const Arduino = require('./Arduino');

const sqlite3 = require('sqlite3').verbose();
const Gpio = require('onoff').Gpio;
const fs = require('fs');

//Files
const DB_FILEPATH = './db/homeWeb.db';
const LOG_FILEPATH = 'log.csv';

//Set Raspberry Pi pins
const LEDPIN = 4;
const RELAY1PIN = 18;
const RELAY2PIN = 23;
let ARDUINO_I2C_ADDR = 0x08;
    const DHT22PIN = 17;

const TEMPPIN = 17;
const SAMPLEINTERVAL = 10; //interval in seconds to sample temperature and humidity


//components
//let component = {};

// let LED = new Gpio(LEDPIN, 'out');
// let RELAY1 = new Gpio(RELAY1PIN, 'out');
// let RELAY2 = new Gpio(RELAY2PIN, 'out');
let indicator = new Led(LEDPIN);
let garageRelay = new GarageRelay(RELAY1PIN);
let arduino = new Arduino(ARDUINO_I2C_ADDR);
let dht22 = new Dht22(DHT22PIN);


class ComponentsCtrl {

    constructor() {
        this.component = {};
        this.update = null;
        this.updateInterval = null;
    }

    init() {
        this.component = {
            ledIndicator: indicator,

            garageRelay: { garageRelay,
                            value: garageRelay.value },

            temp_local: { dht22,
                value: dht22.value.getTemperature() },

            humidity_local: { dht22,
                value: dht22.value.getHumidity() },

            presistor_remote0: { arduino,
                value: arduino.value.getLight() },

            temp_remote0: { arduino,
                value: arduino.value.getTemperature() },

            humidity_remote0: { arduino,
                value: arduino.value.getHumidity() },

        };
    }



    readAllSensors() {

        //put all sensor data into ...

        dht22.readSensor();
        arduino.readSensor();

        let datetime = new Date();
        fs.appendFile(
            LOG_FILEPATH,
            datetime.getTime() +
            "," +
            datetime.toLocaleDateString() +
            "," +
            datetime.toLocaleTimeString() +
            "," +
            this.component.temp_local.value +
            "," +
            this.component.humidity_local.value +
            "\n", function (err) {
            }
        );

        //open database
        let log_sensors = ['temp_local', 'humidity_local', 'temp_remote0', 'humidity_remote0', 'presistor_remote0', 'ledIndicator', 'garageRelay'];

        let db = new sqlite3.Database(DB_FILEPATH, (err) => {
            if (err) {
                console.error("[components.js] " + err.message);
            } else {
                //console.log('Connected to the homeWeb database.');
            }
        });

        for (let key of log_sensors) {
            db.run("INSERT INTO sensor_data(timestamp, description, sensor, value) VALUES( ?, ?, ?, ?)", [datetime.getTime(), this.component[key].name, key, this.component[key].value],
                (err) => {
                    if (err) {
                        console.error(err);
                    }
                }
            );
        }

        db.close((err) => {
            if (err) {
                return console.error(err.message);
            } else {
                //console.log('Close the db connection');
            }
        });
    }


    currentStatus() {
        let currentStatus = {};
        currentStatus.ts = new Date().getTime();

        //TODO: move keys to instance variable and method to change?
        let keys = ['temp_local', 'humidity_local', 'temp_remote0', 'humidity_remote0', 'presistor_remote0', 'led', 'relay1', 'relay2'];


        for (let key of keys) {
            currentStatus[key] = this.component[key].value;
        }
        return currentStatus;
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


