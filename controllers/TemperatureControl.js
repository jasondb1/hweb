"use strict";
const UPDATE_INTERVAL = 10;
const TEMPERATURE_INTERVAL = 0.5;
const TOLERANCE = 0.5; //degrees of tolerance to turn on/off heating of cooling
const DIFFERENTIAL = 3.0;

class TemperatureControl {

    constructor(temperatureSensor = null, fanRelay = null, heatingRelay = null, coolingRelay = null) {
        this.component = {};
        this.heatingTemperature = 18;
        this.setCoolingTemperature = 21;
        this.coolingDifferential = DIFFERENTIAL;
        this.fanAuto = true;
        this.isFanOn = false;
        this.isHeatOn = false;
        this.temperatureSensor = temperatureSensor;
        this.fanRelay = fanRelay;
        this.heatingRelay = heatingRelay;
        this.coolingRelay = coolingRelay;
        this.updateInterval = UPDATE_INTERVAL;
        this.nextEvent = null;
        this.currentTemperature = temperatureSensor.getTemperature();
        this.coolingEnabled = false;
        this.heatingEnabled = true;
        this.hold = -1; //-1 is hold, 0 is off, +x x minutes hold for x minutes

        this.heatOn = this.heatOn.bind(this);
        this.heatOff = this.heatOff.bind(this);
        this.fanOn = this.fanOn.bind(this);
        this.fanOff = this.fanOff.bind(this);
        this.coolingOn = this.coolingOn.bind(this);
        this.coolingOff = this.coolingOff.bind(this);
        this.update = this.update.bind(this);

    }

    //TODO: hold
    setSchedule(values){

        //sort array
        //if null set hold
    }

    getSchedule(values) {

    }

    nextScheduledItem(){

    }

    runSchedule() {
        this.setHold(0);
        //TODO: schedule
        //sorted array/priority queue for next event
//compare next event with time and set temperature

        //statistics: time to heat up 1 degree, warming rate cs outdoor airtemp
    }

    runAuto(){
        this.setHold(0);
        //experimental
        //TODO: auto temp program based on input and exterior data historical data
    }

    setHold(value){
        this.hold(value);
    }



    temperatureUp() {
        this.heatingTemperature += TEMPERATURE_INTERVAL;
        this.setCoolingTemperature = this.setCoolingTemperature + this.coolingDifferential;
    }

    temperatureDown() {
        this.heatingTemperature -= TEMPERATURE_INTERVAL;
        this.setCoolingTemperature = this.setCoolingTemperature + this.coolingDifferential;
    }

    heatOn() {
        this.fanOn();
        this.heatingRelay.on();
        this.isHeatOn = true;
    }

    heatOff() {
        this.heatingRelay.off();
        this.isHeatOn = false;
        this.fanOff();
    }

    fanOn() {
        this.fanRelay.on();
        this.isFanOn = true;
    }

    fanOff() {
        if (this.fanAuto) {
            this.fanRelay.off();
            this.isFanOn = false;
        }
    }

    coolingOn() {
        this.fanOn();
        this.coolingRelay.on();
        this.isCoolingOn = true;
    }

    coolingOff() {
        this.coolingRelay.off();
        this.isCoolingOn = false;
        this.fanOff();
    }

    getHeatingTemperature() {
        return this.heatingTemperature;
    }

    getCoolingTemperature() {
        return this.setCoolingTemperature;
    }

    setCoolingDifferential(degrees) {
        if (degrees > 1){
            this.coolingDifferential = degrees;
        }
    }

    setFanAuto() {
        this.fanAuto = true;
    }

    clearFanAuto() {
        this.fanAuto = false;
    }

    turnOff() {
        this.heatingEnabled = false;
        this.coolingEnabled = false;
    }

    enableHeating(){
        this.heatingEnabled = true;
    }

    disableHeating(){
        this.heatingEnabled = false;
    }

    enableCooling(){
        this.coolingEnabled = true;
    }

    disableCooling(){
        this.coolingEnabled = false;
    }

    getFurnaceStatus(){
        if (this.isHeatOn){
            return 'Heating';
        } else if (this.isCoolingOn) {
            return 'Cooling';
        } else if (this.heatingEnabled && this.coolingEnabled) {
            return 'standby';
        } else {
            return 'off';
        }
    }

    update() {

        //TODO: reduce hold time

        //update temperature
        this.currentTemperature = this.temperatureSensor.getTemperature();

        //deal with heating
        if (this.heatingEnabled) {
            if ((this.currentTemperature + TOLERANCE) > this.heatingTemperature) {
                this.heatOff();
            } else if ((this.currentTemperature - TOLERANCE) < this.heatingTemperature) {
                this.heatOn();
            }
        }

        //deal with cooling
        if (this.coolingEnabled) {
            if ((this.currentTemperature + TOLERANCE) > this.setCoolingTemperature) {
                this.coolingOn();
            } else if ((this.currentTemperature - TOLERANCE) < this.setCoolingTemperature) {
                this.coolingOff();
            }
        }
    }


    start(interval = SAMPLEINTERVAL) {
        this.updateInterval = interval;
        this.updateStatus = setInterval(
            this.update.bind(this)
            , (this.updateInterval * 1000));
    }

    stop() {
        clearInterval(this.updateStatus);
    }

}

module.exports = TemperatureControl;
