import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";
import './GarageControl.css';
const garageIconClosed = require('../icons/icons8-warehouse-80.png');
const garageIconOpen = require('../icons/icons8-depot-80.png');

class GarageControl extends Component {

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
        //this.socket.on('statusUpdate', (data) => {
        this.socket.on('componentStatusUpdate', (data) => {
            this.setState(data);
        });
    }

    componentWillUnmount() {
        this.socket.close();
    }

    handleClick() {
        if (this.state.isOpen) {
            this.socket.emit('componentClose', this.state.component);
            console.log("close garage");
            //api.componentOpen(this.state.component).then(json => this.setState({isOpen: false}));
        } else {
            this.socket.emit('componentOpen', this.state.component);
            console.log("open garage");
            //api.componentClose(this.state.component).then(json => this.setState({isOpen: true}));
        }
    };

    render() {
        return (
            <div className='row align-items-center justify-content-center'>
                <div id='garageButton'>
                    <button 
                        onClick={this.handleClick}
                    >
                        {this.state.isOpen ?
                            <span className="badge badge-danger notify-badge">OPEN</span> :
                            <span className="badge badge-success notify-badge">CLOSED</span>
                        }

                        <img src={this.state.isOpen ? garageIconOpen : garageIconClosed} alt="" width="240" height="240" />
                    </button>
                </div>
            </div>
        );
    }
}

export default GarageControl;
