const ComponentsCtrl = require('../controllers/components');
//const verifyToken = require('../serverAuth.js').verifyToken;
const socketioJwt = require('socketio-jwt');
const {JWT_SECRET} = process.env;

//start updating components at regular intervals
let componentsCtrl = new ComponentsCtrl();
componentsCtrl.init();
componentsCtrl.start();

cSocket = null;

module.exports = function (io) {

    io.on('connection', socketioJwt.authorize({
        //secret: {JWT_SECRET},
        secret: 'awkwardsampleskillfulbagpipepetted',
        timeout: 15000
    }))
        .on('authenticated', client => {

            cSocket = client;
        //Establish a client connection
        //io.on('connection', client => {
        console.log('client connected componentsio');

        //updates
        client.on('subscribeToUpdates', (interval) => {
            console.log('client is subscribing to updates with interval ', interval);
            setInterval(() => {
                client.emit('updates', componentsCtrl.currentStatus());
            }, interval);
        });

//         client.on('componentGetStatus', comp => {
// console.log('get component status');
//             client.emit('componentStatusUpdate', {component: comp, isOpen: false});
//         });
//
//         //component off
//         client.on('turnComponentOff', comp => {
// console.log('turn comp off');
//             componentsCtrl.component[comp].off();
//             client.emit('componentStatusUpdate', {component: comp, isOn: false});
//         });
//
//         //component on
//         client.on('turnComponentOn', comp => {
// console.log('turn comp off');
//             componentsCtrl.component[comp].on();
//             client.emit('componentStatusUpdate', {component: comp, isOn: true});
//         });
//
//         //garage open
//         client.on('componentOpen', comp => {
//             componentsCtrl.component.garageRelay.open();
//             client.emit('componentStatusUpdate', {component: comp, isOpen: true});
//         });
//
//         //garage close
//         client.on('componentClose', comp => {
//             componentsCtrl.component.garageRelay.open();
//             client.emit('componentStatusUpdate', {component: comp, isOpen: false});
//         });

        //user disconnects
        client.on('disconnect', () => {
            console.log('client disconnected');
        });

    });

    cSocket.on('componentGetStatus', comp => {
        console.log('get component status');
        client.emit('componentStatusUpdate', {component: comp, isOpen: false});
    });

    //component off
    cSocket.on('turnComponentOff', comp => {
        console.log('turn comp off');
        componentsCtrl.component[comp].off();
        client.emit('componentStatusUpdate', {component: comp, isOn: false});
    });

    //component on
    cSocket.on('turnComponentOn', comp => {
        console.log('turn comp off');
        componentsCtrl.component[comp].on();
        client.emit('componentStatusUpdate', {component: comp, isOn: true});
    });

    //garage open
    cSocket.on('componentOpen', comp => {
        componentsCtrl.component.garageRelay.open();
        client.emit('componentStatusUpdate', {component: comp, isOpen: true});
    });

    //garage close
    cSocket.on('componentClose', comp => {
        componentsCtrl.component.garageRelay.open();
        client.emit('componentStatusUpdate', {component: comp, isOpen: false});
    });

};


