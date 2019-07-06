const Gpio = require('onoff').Gpio;

class Led {
    name = null;
    value = null;
    status = null;
    pinNumber = null;
    lowOn = false;
    pin = null;
    updateInterval = null;
    update = null;
    log = null;

    constructor(pin_number) {
        this.pinNumber = pin_number;
        this.pin = new Gpio(this.pinNumber, 'out');
        this.value = this.pin.readSync();
    }

    on() {
        if (this.lowOn) {
            this.pin.writeSync(0);
        } else {
            this.pin.writeSync(1);
        }

        this.status = true;
        this.value = true;
    }

    off() {
        if (this.lowOn) {
            this.pin.writeSync(1);
        } else {
            this.pin.writeSync(0);
        }

        this.status = false;
        this.value = false;

    }

    updateValue() {
        this.value = this.pin.readSync();
        return this.value;
    }

    setPin(pin) {
        this.pinNumber = pin;
        this.pin = new Gpio(this.pinNumber, 'out');
    }

    setLowOn() {
        this.lowOn = true;
    }

    start(interval) {
        this.updateInterval = interval;
        this.update = setInterval(
            function () {
                this.updateValue();
            },
            (this.updateInterval * 1000)
        );
    }

    stop(){
        clearInterval(this.update);
    }

};

module.exports =  Led;
