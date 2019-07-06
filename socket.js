console.log('socket.js');

module.exports = function (io) {
//Establish a client connection
    io.on('connection', client => {
        console.log('client connected');

        client.on('subscribeToUpdates', (interval) => {
            console.log('client is subscribing to updates with interval ', interval);

            setInterval(() => {
                client.emit('updates', new Date());
            }, interval);

        });
        //user disconnects
        client.on('disconnect', () => {

            console.log('client disconnected');
        });

    });

};
