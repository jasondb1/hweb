const ComponentsCtrl = require('../controllers/components');
const verifyToken = require('../serverAuth.js').verifyToken;
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

counter = 0;

module.exports = function(io) {

    console.log("Initializing componentsio");	

    io.use(function(socket, next) {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(socket.handshake.query.token, JWT_SECRET, function(err, decoded) {
                if (err) return next(new Error('Authentication error'));
                socket.decoded = decoded;
                next();
            });
	console.log("socket authenticated");	
        } else {
            console.log('authentication error');
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', client => {

        //send data as soon as connection is made
        client.emit('updates', componentsCtrl.currentStatus());

        //updates the client automatically on the interval
        //Could move this to a .on 
        autoUpdate = setInterval(() => {
            client.emit('updates', componentsCtrl.currentStatus());
        }, UPDATEINTERVAL);

        console.log("Connection:" + counter++);

        //user disconnects
        client.on('disconnect', () => {
            console.log('client disconnected:' + counter);
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

        //export data to logfile
        client.on('exportData', () => {
            console.log("export data");
            componentsCtrl.database.exportData();
            //client.emit('statusMessage', {"Success"})
        });

        //clear the logfile
        client.on('clearLog', () => {
            console.log("clear log");
            componentsCtrl.database.clearLog();
            //client.emit('statusMessage', {"Success"})
        });

        //TODO: get sensor data
        client.on('getData', (sensor, timeBack) => {
            let payload = componentsCtrl.database.getSensorData(sensor, timeBack);
            client.emit('sensorData', payload);
        });

        //TODO: getSchedule, setSchedule, set coolingdifferential

        client.on('hydroponicMode', (value) => {
            console.log("socket received message: hydroponicMode: " + value);
	        componentsCtrl.component.hydroponicControl.obj.setMode(value);
            client.emit('componentStatusUpdate', { systemMode: value });
        });
       
        client.on('requestClimateData', () => {
            console.log("climate data");
            payload = componentsCtrl.database.getSensorData("temp_local");
            //request data from database
            //let payload = [{date: "2020-05-01", close:12.2}];
            
            console.log("payload");
            console.log(payload);
            client.emit('incomingClimateData', payload);
        });
        
    });
};
