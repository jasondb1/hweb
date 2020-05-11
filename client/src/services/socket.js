import io from 'socket.io-client';
const SOCKET_SERVER = 'http://192.168.1.108:3001';


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