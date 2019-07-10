"use strict";
const ComponentInput = require('./ComponentInput');
const Gpio = require('onoff').Gpio;
const dht_sensor = require('node-dht-sensor').promises;

const DHT_TYPE = 22;

class Dht22 extends ComponentInput {

    constructor(pin_number, name = 'button', location = "unknown") {
        super();
        this.pinNumber = pin_number;
        this.name = name;
        this.location = location;

        this.pin = new Gpio(this.pinNumber, 'in');
        this.value = this.pin.readSync();


    }

    init() {
//temperature sensor (currently in simulation mode)
        dht_sensor.setMaxRetries(10);
        //sensor.initialize(DHT_TYPE, this.pin_number);
        dht_sensor.initialize({
            test: {
                fake: {
                    temperature: 21.5,
                    humidity: 60.25
                }
            }
        });
    }

    readSensor() {
        dht_sensor.read(DHT_TYPE, this.pinNumber)
            .then(res => {
                    let datetime = new Date();
                    //console.log(res);
                    //console.log(`temp: ${res.temperature.toFixed(1)} deg C`
                    //    + `    humidity: ${res.humidity.toFixed(1)}%`
                    //    + `    ts:` + datetime.toLocaleString());

                    this.value.temperature = res.temperature.toFixed(2);
                    this.value.humidity = res.humidity.toFixed(2);
                },
            )
            .catch(err => {
                console.error('failed to read sensor data:', err);
            });
    }

    getTemperature() {
        this.readSensor();
        return this.value.temperature;
    }

    getHumidity() {
        this.readSensor();
        return this.value.humidity;
    }

}


module.exports = Dht22;