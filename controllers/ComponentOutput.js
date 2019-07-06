const Gpio = require('onoff').Gpio;

class ComponentOutput {

    constructor() {
        this.name = null;
        this.location = null;
        this.value = null;
        this.status = null;
        this.pinNumber = null;
        this.lowOn = false;
        this.pin = null;
        this.updateInterval = null;
        this.update = null;
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

    start(interval = 30) {
        this.updateInterval = interval;
        this.update = setInterval(
            function () {
                this.updateValue();
            },
            (this.updateInterval * 1000)
        );
    }

    stop() {
        clearInterval(this.update);
    }
}

module.exports =  ComponentOutput;
