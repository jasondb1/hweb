import React, {Component} from 'react';
import api from "../services/componentService";
import {getAuthSocket, socket} from "../services/socket";
//import { subscribeToUpdates } from "../services/socket";
//import { socket } from "../services/socket";
const UPDATEINTERVAL = 10000;

const ListItems = (props) => {
    console.log(props.values);
    //console.log(props.values.length());

    return (
        <ul>
            <li key="ts">Time: {props.values.ts}</li>
            <li key="temp_local">Temperature Local: {props.values.temp_local}</li>
            <li key="humidity_local">Humidity Local: {props.values.humidity_local}</li>
            <li key="temp_remote0">Temperature Remote: {props.values.temp_remote0}</li>
            <li key="humidity_remote0">Humidity Remote: {props.values.humidity_remote0}</li>
            <li key="presistor_remote0">Light Remote: {props.values.presistor_remote0}</li>
        </ul>
    )
};

class Status extends Component {
    constructor() {
        super();
        this.state = {
            status: [],
        };

        this.updateStatus = this.updateStatus.bind(this);
    }

    componentDidMount() {

        this.socket = getAuthSocket();
        this.subscribeToUpdates((err, payload) => this.setState({status: payload}));

        //this.interval = setInterval(this.updateStatus, UPDATEINTERVAL);
    };


    componentWillUnmount() {
        clearInterval(this.interval);
    }

    updateStatus() {
        //console.log("updating status");
        api.getStatus().then(json => this.setState({status: json}));
    }

    subscribeToUpdates(callback) {
        console.log('subscribing to updates');
        this.socket.on('updates',
            payload => callback(null, payload)
        );

        this.socket.emit('subscribeToUpdates', UPDATEINTERVAL);
    }

    render() {
        return (
            <div>
                <h2>Status</h2>
                <ListItems values={this.state.status}/>
            </div>
        );
    }

}

export default Status;
