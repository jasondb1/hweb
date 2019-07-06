import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:3001');

function subscribeToUpdates(callback) {
    socket.on('updates',
        timestamp => callback(null, timestamp)
    );

    socket.emit('subscribeToUpdates', 2000);
}
export { subscribeToUpdates };
