import io from 'socket.io-client';
require('dotenv').config();
const SOCKET_SERVER = process.env.SOCKET_SERVER;

// let authSocket = (function(){
//     let socketInstance;

//     let newSocket = function() {
//         let token = localStorage.getItem('token');

//         return io.connect(SOCKET_SERVER, {
//             query: { token: token }
//         });
//     }

//     return {
//         getInstance: function(){
//             if(!socketInstance){
//                 console.log ("new socket")
//                 socketInstance = newSocket();
//             }
//             console.log("socket returned");
//             return socketInstance;
//         }
//     };

// })();



//new socket function
//check if socket exists, if one exists then return socket otherwise new socket

function authSocket() {
    let token = localStorage.getItem('token');

    return io.connect(SOCKET_SERVER, {
        query: { token: token }
    });
}

//new socket function
//check if socket exists, if one exists then return socket otherwise new socket

export {
    authSocket,
};
