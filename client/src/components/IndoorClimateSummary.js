import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";

const climateIcon = require('../icons/icons8-temperature-50.png');

const ListItems = (props) => {

    let date = new Date(props.values.ts);
    let formatted_time = date.toLocaleTimeString();

    return (
        <ul className='status-list'>
            <li key="ts">Time: {formatted_time}</li>
            <li key="temp_local">Temperature: {props.values.temp_local}</li>
            <li key="humidity_local">Humidity: {props.values.humidity_local}</li>
            <li key="fan_local">Fan: {props.values.furnace_fan ?
                <span className="badge badge-danger">ON</span> :
                <span className="badge badge-success">OFF</span>
            }</li>
            <li key="furnace_local">Furnace Status: {props.values.furnace_status === 'Heat' ?
                <span className="badge badge-danger">HEAT</span> :
                (props.values.furnace_status === 'Cool' ?
                        <span className="badge badge-primary">COOL</span> :
                        <span className="badge badge-success">OFF</span>
                )
            }
            </li>

        </ul>
    )
};

class IndoorClimateSummary extends Component {

    constructor(props) {
        super(props);

        this.state = {
            status: [],
        };

        this.handleClick = this.handleClick.bind(this);
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
                            <h5 className="card-title mt-md-2">Indoor Climate</h5>
                            <ListItems values={this.state.status}/>
                        </div>
                    </div>
                </div>

            </div>
        );
    }
}

export default IndoorClimateSummary;
