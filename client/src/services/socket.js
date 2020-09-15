import io from 'socket.io-client';
require('dotenv').config();
const SOCKET_SERVER = process.env.SOCKET_SERVER;
//const SOCKET_SERVER = 'http://192.168.1.20:3001';


function getAuthSocket() {
    let token = localStorage.getItem('token');

    return io.connect(SOCKET_SERVER, {
        query: { token: token }
    });
}

//new socket function
//check if socket exists, if one exists then return socket otherwise new socket

export {
    getAuthSocket,
};
