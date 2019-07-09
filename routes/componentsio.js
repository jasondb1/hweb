const ComponentsCtrl = require('../controllers/components');
//const verifyToken = require('../serverAuth.js').verifyToken;
const socketioJwt = require('socketio-jwt');
const {JWT_SECRET} = process.env;

//start updating components at regular intervals
let componentsCtrl = new ComponentsCtrl();
componentsCtrl.init();
componentsCtrl.start();

module.exports = function (io) {

    io.on('connection', socketioJwt.authorize({
        //secret: {JWT_SECRET},
        secret: 'awkwardsampleskillfulbagpipepetted',
        timeout: 15000
    })).on('authenticated', client => {
        //Establish a client connection
        //io.on('connection', client => {
        console.log('client connected');

        //updates
        client.on('subscribeToUpdates', (interval) => {
            console.log('client is subscribing to updates with interval ', interval);
            setInterval(() => {
                client.emit('updates', componentsCtrl.currentStatus());
            }, interval);
        });

        client.on('componentGetStatus', comp => {
            client.emit('componentStatusUpdate', {component: comp, isOpen: false});
        });

        //component off
        client.on('turnComponentOff', comp => {
            componentsCtrl.component[comp].off();
            client.emit('componentStatusUpdate', {component: comp, isOn: false});
        });

        //component on
        client.on('turnComponentOn', comp => {
            componentsCtrl.component[comp].on();
            client.emit('componentStatusUpdate', {component: comp, isOn: true});
        });

        //garage open
        client.on('componentOpen', comp => {
            componentsCtrl.component.garageRelay.open();
            client.emit('componentStatusUpdate', {component: comp, isOpen: true});
        });

        //garage close
        client.on('componentClose', comp => {
            componentsCtrl.component.garageRelay.open();
            client.emit('componentStatusUpdate', {component: comp, isOpen: false});
        });

        //user disconnects
        client.on('disconnect', () => {
            console.log('client disconnected');
        });

    });
};
