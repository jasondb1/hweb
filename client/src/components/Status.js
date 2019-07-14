import React, {Component} from 'react';
import api from "../services/componentService";
import {getAuthSocket} from "../services/socket";

const ListItems = (props) => {

    let date = new Date(props.values.ts);
    let formatted_time = date.toLocaleTimeString();

    return (
        <ul>
            <li key="ts">Time: {formatted_time}</li>
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
        this.socket.on('updates', (payload) => {
            this.setState({status: payload});
        });
    };

    componentWillUnmount() {
        this.socket.close();
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
