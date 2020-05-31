const Gpio = require('onoff').Gpio;

class ComponentArduino {

    constructor() {
        this.name = null;
        this.location = null;
        this.value = null;
        this.status = null;
        this.pinNumber = null;
        this.pin = null;
        this.updateInterval = null;
        this.update = null;
    }

    updateValue() {
        this.value = this.pin.readSync();
        return this.value;
    }

    getValue() {
        this.value = this.pin.readSync();
        return this.value;
    }

    setPin(pin) {
        this.pinNumber = pin;
        this.pin = new Gpio(this.pinNumber, 'in');
    }

    start(interval = 30) {
        this.updateInterval = interval;
        this.update = setInterval(
            function() {
                this.updateValue.bind(this)
            },
            (this.updateInterval * 1000)
        );
    }

    stop() {
        clearInterval(this.update);
    }

    //TODO: do the following for arduino with i2c-bus
    on() {
        //send message to arduino to turn on
        this.status = true;
        this.value = true;
    }

    off() {
        //send message to arduino to turn off

        this.status = false;
        this.value = false;

    }

}

module.exports = ComponentArduino;