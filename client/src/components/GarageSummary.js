import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";
const garageIconClosed = require('../icons/icons8-warehouse-80.png');
const garageIconOpen = require('../icons/icons8-depot-80.png');

class GarageSummary extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Garage Relay',
            isOpen: props.isOpen,
            component: 'garageRelay'
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {

        this.socket = getAuthSocket();

        //TODO: This should be a door sensor
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
        this.props.history.push('/main/garage');
    };

    render() {
        return (
            <div className='card border-primary mt-3' onClick={this.handleClick}>
                <div className="row no-gutters d-inline-flex">
                    <div className="p-1 summary-icon">
                        <img src={this.state.isOpen ? garageIconOpen : garageIconClosed} alt="" width="80" height="80" />

                    </div>
                    <div className="">
                        <div className="card-body">
                            <h5 className="card-title mt-md-2">Garage</h5>

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

export default GarageSummary;
