const ComponentsCtrl = require('../controllers/components');
//const verifyToken = require('../serverAuth.js').verifyToken;
const { JWT_SECRET } = process.env;

const io = require('socket.io')();
const jwt = require('jsonwebtoken');

let subscribedUpdate = null;
let UPDATEINTERVAL = 10000;


//start updating components at regular intervals
let componentsCtrl = new ComponentsCtrl();
componentsCtrl.init();
componentsCtrl.enableLogging();
componentsCtrl.start();

module.exports = function(io) {

    io.use(function(socket, next) {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(socket.handshake.query.token, JWT_SECRET, function(err, decoded) {
                if (err) return next(new Error('Authentication error'));
                socket.decoded = decoded;
                next();
            });
        } else {
            console.log('authentication error');
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', client => {

        client.emit('updates', componentsCtrl.currentStatus());

        //updates the client automatically on the interval
        autoUpdate = setInterval(() => {
            client.emit('updates', componentsCtrl.currentStatus());
        }, UPDATEINTERVAL);



        //user disconnects
        client.on('disconnect', () => {
            console.log('client disconnected');
        });

        //client.on('componentGetStatus', comp => {
        //    client.emit('componentStatusUpdate', {component: comp, isOpen: false});
        //});

        //component off
        client.on('turnComponentOff', comp => {
            componentsCtrl.component[comp].obj.off();
            client.emit('componentStatusUpdate', { component: comp, isOn: false });
        });

        //component on
        client.on('turnComponentOn', comp => {
            componentsCtrl.component[comp].obj.on();
            client.emit('componentStatusUpdate', { component: comp, isOn: true });
        });

        //garage close
        client.on('componentOpen', comp => {
            componentsCtrl.component.garageRelay.obj.open();
            client.emit('componentStatusUpdate', { component: comp, isOpen: true });
        });

        //garage open
        client.on('componentClose', comp => {
            componentsCtrl.component.garageRelay.obj.open();
            client.emit('componentStatusUpdate', { component: comp, isOpen: false });
        });

        //temperature up
        client.on('temperatureUp', () => {
            componentsCtrl.component.temperatureControl.obj.temperatureUp();
            client.emit('statusUpdate', {
                heatingTemperature: componentsCtrl.component.heatingTemperature.value,
                coolingTemperature: componentsCtrl.component.coolingTemperature.value
            });
        });

        //temperature down
        client.on('temperatureDown', () => {
            componentsCtrl.component.temperatureControl.obj.temperatureDown();
            client.emit('statusUpdate', {
                heatingTemperature: componentsCtrl.component.heatingTemperature.value,
                coolingTemperature: componentsCtrl.component.coolingTemperature.value
            });

        });

        //heat enabled
        client.on('enableHeat', (value) => {
            if (value) {
                componentsCtrl.component.temperatureControl.enableHeating();
            } else {
                componentsCtrl.component.temperatureControl.disableHeating();
            }
            client.emit('statusUpdate', { heatingEnabled: componentsCtrl.component.heatingEnabled.value, })
        });

        // //heat disabled
        // client.on('disableHeat', () => {
        //     componentsCtrl.component.temperatureControl.disableHeating();
        //     client.emit('statusUpdate', {heatingEnabled: componentsCtrl.component.heatingEnabled.value,})
        // });

        client.on('enableCooling', (value) => {
            if (value) {
                componentsCtrl.component.temperatureControl.enableCooling;
            } else {
                componentsCtrl.component.temperatureControl.disableCooling;
            }
            client.emit('statusUpdate', { coolingEnabled: componentsCtrl.component.coolingEnabled.value, })
        });

        //fan on
        client.on('fanOn', (value) => {
            if (value) {
                console.log('routes fan on');
                componentsCtrl.component.temperatureControl.obj.fanOn;
            } else {
                console.log('routes fan off');
                componentsCtrl.component.temperatureControl.obj.setFanAuto;
            }
            client.emit('statusUpdate', { furnaceFanMode: componentsCtrl.component.furnaceFanMode.value, })
        });

        //temperature hold
        client.on('setHold', (value) => {
            componentsCtrl.component.temperatureControl.setHold(value);
            client.emit('statusUpdate', { temperatureHold: componentsCtrl.component.temperatureHold.value, })
        });

        //TODO: getSchedule, setSchedule, set coolingdifferential


    });
};