import openSocket from 'socket.io-client';
const httpClient = require('httpClient');
const socket = openSocket('http://192.168.1.108:3001');

socket.on('connection', () =>
console.log('socket connected');
)

const UPDATEINTERVAL = 10000;

function subscribeToUpdates(callback) {
	console.log('subscribing to updates');

    socket.on('updates',
        payload => callback(null, payload)
    );

    socket.emit('subscribeToUpdates', UPDATEINTERVAL);
}

function componentOn(component) {
    console.log('component on:' + component );
    socket.emit('turnComponentOn', component);
}

function componentOff(component) {
    console.log('component off:' + component );
    socket.emit('turnComponentOff', component);
}

function componentOpen(component) {
    console.log('component open:' + component );
    socket.emit('componentOpen', component);
}

function componentClose(component) {
    console.log('component close:' + component );
    socket.emit('componentClose', component);
}

function componentGetStatus(component) {
    console.log('component close:' + component );
    socket.emit('componentGetStatus', component);
}



export {    subscribeToUpdates,
            componentOn,
            componentOff,
            componentOpen,
            componentClose,
            componentGetStatus,
            socket,
};
