import axios from 'axios'
import httpClient from './httpClient.js'
import trimFields from './helperTrimFields.js';



// instantiate axios
const databaseService = axios.create();

// During initial app load attempt to set a localStorage stored token
// as a default header for all api requests.
databaseService.defaults.headers.common.token = httpClient.getToken();

//Restpath should be of form "/api/database/x/"
databaseService.newRecord = function (fieldData, restPath) {
    return this({ method: 'post', url: restPath, data: trimFields(fieldData) })
        .then((serverResponse) => {
            // console.log(serverResponse.data);
            // console.log(serverResponse);
            if (serverResponse.data.success === true) {
                return serverResponse.data;
            } else {
                return { message: 'Record Not Added', success: false };
            }
        })
        .catch(err => {if (err) console.log("error entering new record")})
};

databaseService.getAllRecords = function (restPath) {
    return this({ method: 'get', url: restPath })
        .then((serverResponse) => {
            //get all users
            return serverResponse.data;

        })
};

databaseService.updateRecord = function (restPath, fieldData) {
    let fields = trimFields(fieldData);
    return this({ method: 'put', url: (restPath + fields.id), data: fields })
        .then((serverResponse) => {
            //console.log(serverResponse);
            // console.log(serverResponse);
            if (serverResponse.data.success === true) {
                return serverResponse.data;
            } else {
                return { message: 'Record Not Added', success: false };
            }
        })
        .catch(err => {if (err) console.log("error entering new record")})
};

databaseService.deleteFarm = function (restPath, Id) {
    return this({ method: 'delete', url: (restPath + Id) })
        .then((serverResponse) => {
            return serverResponse.data;
        })
};


export default databaseService
