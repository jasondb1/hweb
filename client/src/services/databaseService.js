import axios from 'axios'
import httpClient from 'httpClient'

// instantiate axios
const databaseService = axios.create();

// During initial app load attempt to set a localStorage stored token
// as a default header for all api requests.
databaseService.defaults.headers.common.token = httpClient.getToken();

databaseService.getAllUsers = function () {
    return this({method: 'get', url: '/api/database/'})
        .then((serverResponse) => {
            //get all users
            return serverResponse.data;

        })
};

databaseService.updateUser = function (userInfo) {
    return this({method: 'put', url: ('/api/database/' + userInfo.id), data: userInfo})
        .then((serverResponse) => {
            return serverResponse.data;
        })
};

databaseService.deleteUser = function (userId) {
    return this({method: 'delete', url: ('/api/users/' + userId)})
        .then((serverResponse) => {
            return serverResponse.data;
        })
};


export default databaseService
