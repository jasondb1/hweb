import React, {Component} from 'react';
import api from "../services/componentService";
import { subscribeToUpdates} from "../services/socket";

const UPDATEINTERVAL = 10000;

const ListItems = (props) => {
    console.log(props.values);
    //console.log(props.values.length());

    return (
        <ul>
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
            timestamp: 'no timestamp yet',
            status: [],
        };

        subscribeToUpdates((err, timestamp) => this.setState({timestamp})
        //subscribeToUpdates((err, payload) => this.setState({status: payload})

        );

        this.updateStatus = this.updateStatus.bind(this);
    }

    componentDidMount() {
        //this.interval = setInterval(this.updateStatus, UPDATEINTERVAL);
    };


    componentWillUnmount() {
        clearInterval(this.interval);
    }

    updateStatus() {
        //console.log("updating status");
        api.getStatus().then(json => this.setState({status: json}));
    }

    render() {
        return (
            <div>
                <h2>Status</h2>
                <p>Timestamp: {this.state.timestamp}</p>
                <ListItems values={this.state.status}/>
            </div>
        );
    }

}

export default Status;
