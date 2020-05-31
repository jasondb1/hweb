import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";
const doorClosed = require('../icons/icons8-door-closed-80.png');
const doorOpen = require('../icons/icons8-open-door-80.png');

class DoorSummary extends Component {

    constructor(props) {
        super(props);

        //TODO: Multiple doors/windows status sensor
        this.state = {
            label: 'Door Sensor',
            isOpen: props.isOpen,
            component: 'doorSensor'
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {

        this.socket = getAuthSocket();

        //TODO: This should be a door sensor status
        this.socket.on('componentStatusUpdate', (data) => {
            if (data.component === this.state.component) {
                this.setState({isOpen: data.isOpen});
            }
        });
    }

    componentWillUnmount() {
        this.socket.close();
    }

    handleClick() {
        this.props.history.push('/main/doors');
    };

    render() {
        return (
            <div className='card border-primary mt-3' onClick={this.handleClick}>
                <div className="row no-gutters d-inline-flex">
                    <div className="p-1 summary-icon">
                        <img src={this.state.isOpen ? doorOpen : doorClosed} alt="" width="80" height="80" />
                    </div>
                    <div className="">
                        <div className="card-body">
                            <h5 className="card-title mt-md-2">Doors (In Progress)</h5>
                            <ul className='status-list'>
                                <li>Door:  {this.state.isOpen ?
                                    <span className="badge badge-danger">OPEN</span> :
                                    <span className="badge badge-success">CLOSED</span>
                                }
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        );
    }
}

export default DoorSummary;
