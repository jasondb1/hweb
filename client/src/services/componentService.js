import axios from 'axios';
import httpClient from './httpClient';

const baseAPI = '/api';

const request = axios.create();
request.defaults.headers.common.token = httpClient.getToken();

const homewebService = {

    getStatus() {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/status`, {headers: {token: httpClient.getToken(),}})
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => {
                    reject(err);
                });
        });
    },

    getComponentState(component) {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/component/${component}`)
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => {
                    reject(err);
                });
        });
    },

    componentOn(component) {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/component_on/${component}`, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    token: httpClient.getToken(),
                }
            })
            //.then(response => response.json())
                .then(result => resolve(result))
                .catch(err => {
                    reject(err);
                });
        });
    },

    componentOff(component) {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/component_off/${component}`, {
                method: 'POST',
                body: JSON.stringify({}),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    token: httpClient.getToken(),
                }
            })
            //.then(response => response.json())
                .then(result => resolve(result))
                .catch(err => {
                    reject(err);
                });
        });
    },

    ledOn() {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/led_on`)
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => {
                    reject(err);
                });
        });
    },

    ledOff() {
        return new Promise((resolve, reject) => {
            fetch(`${baseAPI}/led_off`)
                .then(response => response.json())
                .then(json => resolve(json))
                .catch(err => {
                    reject(err);
                });
        });
    },
};

export default homewebService;
