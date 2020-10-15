import axios from 'axios'
import httpClient from './httpClient.js'
import trimFields from './helperTrimFields.js';

// instantiate axios
const bedDbService = axios.create();

// During initial app load attempt to set a localStorage stored token
// as a default header for all api requests.
bedDbService.defaults.headers.common.token = httpClient.getToken();

bedDbService.newFarm = function (fieldData) {
    return this({ method: 'post', url: '/api/database/farm/', data: trimFields(fieldData) })
        .then((serverResponse) => {
            //console.log(serverResponse);
            // console.log(serverResponse);
            if (serverResponse.data.success === true) {
                return serverResponse.data;
            } else {
                return { message: 'Item Not Added', success: false };
            }
        })
        .catch(err => {if (err) console.log("error entering new farm")})
};

bedDbService.getAllFarms = function () {
    return this({ method: 'get', url: '/api/database/farm/' })
        .then((serverResponse) => {
            //get all users
            return serverResponse.data;

        })
};

bedDbService.updateFarm = function (fieldData) {
    let fields = trimFields(fieldData);
    return this({ method: 'put', url: ('/api/database/farm/' + fields.id), data: fields })
        .then((serverResponse) => {
            //console.log(serverResponse);
            // console.log(serverResponse);
            if (serverResponse.data.success === true) {
                return serverResponse.data;
            } else {
                return { message: 'Item Not Added', success: false };
            }
        })
        .catch(err => {if (err) console.log("error entering new farm")})
};

bedDbService.deleteFarm = function (Id) {
    return this({ method: 'delete', url: ('/api/database/farm/' + Id) })
        .then((serverResponse) => {
            return serverResponse.data;
        })
};


export default bedDbService
