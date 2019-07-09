import openSocket from 'socket.io-client';
//const httpClient = require('./httpClient');
let socket = null;
const SOCKET_SERVER = 'http://192.168.1.108:3001';

// function authenticate() {
//         socket = openSocket('http://192.168.1.108:3001');
//
//     socket.on('connect', () => {
//         console.log('authenticate');
//         let token = localStorage.getItem('token');
//         console.log( localStorage.getItem('token') );
//         socket.emit('authenticate', {token: token})
//             .on('authenticated', () => {
//                 console.log('socket authenticated')
//             })
//             .on('unauthorized', function(error, callback) {
//                 if (error.data.type === "UnauthorizedError" || error.data.code === "invalid_token") {
//                     // redirect user to login page perhaps or execute callback:
//                     callback();
//                     console.log("User's token has expired");
//                 }
//             });
//
//     });
//     return socket;
//
// }

function getAuthSocket() {
    socket = openSocket(SOCKET_SERVER);
    socket.on('connect', () => {
        //console.log('authenticate');
        let token = localStorage.getItem('token');
        //console.log( localStorage.getItem('token') );
        socket.emit('authenticate', {token: token})
            .on('authenticated', () => {
                console.log('socket authenticated')
            })
            .on('unauthorized', function(error, callback) {
                if (error.data.type === "UnauthorizedError" || error.data.code === "invalid_token") {
                    // redirect user to login page perhaps or execute callback:
                    callback();
                    console.log("User's token has expired");
                }
            });



    });
    return socket;
}

// function subscribeToUpdates(callback) {
// 	console.log('subscribing to updates');
//
//     if (socket !== null ) {
//         socket.on('updates',
//             payload => callback(null, payload)
//         );
//
//         socket.emit('subscribeToUpdates', UPDATEINTERVAL);
//     }
// }

// function componentOn(component) {
//     console.log('component on:' + component );
//     socket.emit('turnComponentOn', component);
// }
//
// function componentOff(component) {
//     console.log('component off:' + component );
//     socket.emit('turnComponentOff', component);
// }

// function componentOpen(component) {
//     console.log('component open:' + component );
//     socket.emit('componentOpen', component);
// }
//
// function componentClose(component) {
//     console.log('component close:' + component );
//     socket.emit('componentClose', component);
// }

function componentGetStatus(component) {

    if (socket !== null ) {
        console.log('component get status:' + component);
        socket.emit('componentGetStatus', component);
    }
}



export {    //subscribeToUpdates,
            //componentOn,
            //componentOff,
            //componentOpen,
            //componentClose,
            componentGetStatus,
            //authenticate,
            getAuthSocket,
            socket,
};
