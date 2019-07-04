const sqlite3 = require('sqlite3').verbose();

const Gpio = require('onoff').Gpio;
const dht_sensor = require('node-dht-sensor').promises;
const fs = require('fs');
const i2c = require('i2c-bus');
const i2c_bus = i2c.openSync(1);

//i2c comm settings for arduino
let arduino_i2cAddress = 0x08;
let arduino_data_length = 0x20;
let buffer_arduino = Buffer.alloc(arduino_data_length, 0x00);

//Set Raspberry Pi pins
const LEDPIN = 4;
const RELAY1PIN = 18;
const RELAY2PIN = 23;

const TEMPPIN = 17;
const SAMPLEINTERVAL = 10; //interval in seconds to sample temperature and humidity

//components
let component = {};
//let currentStatus = {};

let LED = new Gpio(LEDPIN, 'out');
let RELAY1 = new Gpio(RELAY1PIN, 'out');
let RELAY2 = new Gpio(RELAY2PIN, 'out');

module.exports = {
    initialize: () => {

        component = {
            led: {
                pin: LED,
                name: 'LED',
                status: LED.readSync(),
                value: null

            },
            relay1: {
                pin: RELAY1,
                name: 'Relay 1',
                status: RELAY1.readSync(),
                value: null,
                low_on: true,
            },
            relay2: {
                pin: RELAY2,
                name: 'Relay 2',
                status: RELAY2.readSync(),
                value: null,
                low_on: true,
            },
            temp_local: {
                pin: null,
                name: 'DHT22 - temperature',
                status: null,
                value: null,

            },
            humidity_local: {
                pin: null,
                name: 'DHT22 - humidity',
                status: null,
                value: null,

            },
            presistor_remote0: {
                pin: i2c,
                slave_addr: 0x08,
                name: 'photo resistor',
                status: null,
                value: null
            },
            temp_remote0: {
                pin: i2c,
                slave_addr: 0x08,
                name: 'remote_temp1',
                status: null,
                value: null,

            },
            humidity_remote0: {
                pin: i2c,
                slave_addr: 0x08,
                name: 'DHT22 - humidity',
                status: null,
                value: null,

            },
        };

        //temperature sensor (currently in simulation mode
        dht_sensor.setMaxRetries(10);
//sensor.initialize(22, TEMPPIN);
        dht_sensor.initialize({
            test: {
                fake: {
                    temperature: 21.5,
                    humidity: 60.25
                }
            }
        });


    },


/////////////////////////////
// readTemp

    readTemp: () => {
        dht_sensor.read(22, TEMPPIN)
            .then(res => {
                    let datetime = new Date();
                    console.log(res);
                    console.log(`temp: ${res.temperature.toFixed(1)} deg C`
                        + `    humidity: ${res.humidity.toFixed(1)}%`
                        + `    ts:` + datetime.toLocaleString());

                    component.temp_local.value = res.temperature.toFixed(2);
                    component.humidity_local.value = res.humidity.toFixed(2);

                },
                //err => {
                //    console.error("Failed to read sensor data:", err);
                //}
            )
            .catch(err => {
                console.error('failed to read sensor data:', err);
            });
    },

/////////////////////////////
// readArduino

    readArduino: () => {
        i2c_bus.i2cReadSync(arduino_i2cAddress, arduino_data_length, buffer_arduino);
        string = buffer_arduino.toString();
        let vals = string.split(/[\s,\0]+/, 3);

        component.presistor_remote0.value = vals[0];
        component.temp_remote0.value = vals[1];
        component.humidity_remote0.value = vals[2];

        console.log(string.split(/[\s,\0]+/, 3));

    },

/////////////////////////////
// readSensors

    readAllSensors: () => {
        readTemp();
        readArduino();

        //console.log(component);
        let datetime = new Date();
        fs.appendFile(
            "log.csv",
            datetime.getTime() +
            "," +
            datetime.toLocaleDateString() +
            "," +
            datetime.toLocaleTimeString() +
            "," +
            component.temp_local.value +
            "," +
            component.humidity_local.value +
            "\n", function (err) {
            }
        );

//open database
        let log_sensors = ['temp_local', 'humidity_local', 'temp_remote0', 'humidity_remote0', 'presistor_remote0', 'led', 'relay1', 'relay2'];

        let db = new sqlite3.Database('./db/homeWeb.db', (err) => {
            if (err) {
                console.error("[components.js] " + err.message);
            } else {
                //console.log('Connected to the homeWeb database.');
            }
        });

        for (key of log_sensors) {
            db.run("INSERT INTO sensor_data(timestamp, description, sensor, value) VALUES( ?, ?, ?, ?)", [datetime.getTime(), component[key].name, key, component[key].value],
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

    },

    start: () => {
        setInterval(function () {
            readAllSensors();
        }, (SAMPLEINTERVAL * 1000));
    },

};


