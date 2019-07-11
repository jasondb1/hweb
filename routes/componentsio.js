const ComponentsCtrl = require('../controllers/components');
//const verifyToken = require('../serverAuth.js').verifyToken;
const {JWT_SECRET} = process.env;

const io = require('socket.io')();
const jwt = require('jsonwebtoken');


//start updating components at regular intervals
let componentsCtrl = new ComponentsCtrl();
componentsCtrl.updateComponents();
componentsCtrl.start();

module.exports = function (io) {

    io.use(function (socket, next) {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(socket.handshake.query.token, JWT_SECRET, function (err, decoded) {
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
        console.log('client connected componentsio');

        //updates
        client.on('subscribeToUpdates', (interval) => {
            console.log('client is subscribing to updates with interval ', interval);
            setInterval(() => {
                client.emit('updates', componentsCtrl.currentStatus());
            }, interval);
        });

        //client.on('componentGetStatus', comp => {
        //    client.emit('componentStatusUpdate', {component: comp, isOpen: false});
        //});

        //component off
        client.on('turnComponentOff', comp => {
            componentsCtrl.component[comp].obj.off();
            client.emit('componentStatusUpdate', {component: comp, isOn: false});
        });

        //component on
        client.on('turnComponentOn', comp => {
            componentsCtrl.component[comp].obj.on();
            client.emit('componentStatusUpdate', {component: comp, isOn: true});
        });

        //garage open
        client.on('componentOpen', comp => {
            componentsCtrl.component.garageRelay.obj.open();
            client.emit('componentStatusUpdate', {component: comp, isOpen: true});
        });

        //garage close
        client.on('componentClose', comp => {
            componentsCtrl.component.garageRelay.obj.open();
            client.emit('componentStatusUpdate', {component: comp, isOpen: false});
        });

        //user disconnects
        client.on('disconnect', () => {
            console.log('client disconnected');
        });

    });
};
