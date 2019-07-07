import openSocket from 'socket.io-client';
const socket = openSocket('http://192.168.1.108:3001');

console.log( 'socket.js');

function subscribeToUpdates(callback) {
	console.log('subscribing to updates');

    socket.on('updates',
        timestamp => callback(null, timestamp)
    );

    socket.emit('subscribeToUpdates', 2000);
}

function componentOn(component) {
    console.log('component on:' + component );
    socket.emit('turnComponentOn', component);
}

function componentOff(component) {
    console.log('component off:' + component );
    socket.emit('turnComponentOff', component);
}



export {    subscribeToUpdates,
            componentOn,
            componentOff,
            socket,
};
