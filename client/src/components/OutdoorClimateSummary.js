import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";
//import api from "../services/componentService";

const climateIcon = require('../icons/icons8-temperature-outside-50-2.png');

//const UPDATEINTERVAL = 10000;
const ListItems = (props) => {
    return (
        <ul className='status-list'>
            <li key="temp_remote0">Temperature: {props.values.temp_remote0}</li>
            <li key="humidity_remote0">Humidity: {props.values.humidity_remote0}</li>
            <li key="presistor_remote0">Light: {props.values.presistor_remote0}</li>
        </ul>
    )
};

class OutdoorClimateSummary extends Component {

    constructor(props) {
        super(props);

        this.state = {
            status: [],
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        this.socket = getAuthSocket();
        // this.subscribeToUpdates((err, payload) => {
        //     this.setState({status: payload})
        this.socket.on('updates', (payload) => {
            console.log('received update');
            console.log(payload);
            this.setState({status: payload});
        });
    };


    subscribeToUpdates(callback) {
        this.socket.on('updates',
            payload => callback(null, payload)
        );
    }

    handleClick() {
        this.props.history.push('/main/climate');
    };

    render() {
        return (
            <div className='card border-primary mt-3' onClick={this.handleClick}>
                <div className="row no-gutters d-inline-flex">
                    <div className="p-1 summary-icon">
                        <img src={climateIcon} alt="" width="80" height="80"/>
                    </div>
                    <div className="">
                        <div className="card-body">
                            <h5 className="card-title mt-md-2">Outdoor Climate</h5>
                            <ListItems values={this.state.status} />
                        </div>
                    </div>
                </div>

            </div>
        );
    }
}

export default OutdoorClimateSummary;
