const verifyToken = require('../serverAuth.js').verifyToken;
const socketioJwt = require('socketio-jwt');
const {JWT_SECRET} = process.env;
console.log('socket.js');


module.exports = function (io) {
//Establish a client connection
//     io.on('connection', client => {
//         console.log('client connected');
//
//
//
//         client.on('subscribeToUpdates', (interval) => {
//             console.log('client is subscribing to updates with interval ', interval);
//
//             setInterval(() => {
//                 client.emit('updates', new Date());
//             }, interval);
//
//         });
//         //user disconnects
//         client.on('disconnect', () => {
//
//             console.log('client disconnected');
//         });
//
//     });
//
// };

    io.on('connection', socketioJwt.authorize({
        secret: {JWT_SECRET},
        timeout: 15000
    })).on('authenticated', client => {
        console.log('client connected');
        console.log('hello! ' + client.decoded_token.name);



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
