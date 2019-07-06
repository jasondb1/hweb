import openSocket from 'socket.io-client';
const socket = openSocket('http://192.168.1.108:3001');

console.log( 'socket');

function subscribeToUpdates(callback) {
	console.log('subscribing to updates');

    socket.on('updates',
        timestamp => callback(null, timestamp)
    );

    socket.emit('subscribeToUpdates', 2000);
}
export { subscribeToUpdates };
