import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";
import './HydroponicControl.css';
const garageIconClosed = require('../icons/icons8-warehouse-80.png');
const garageIconOpen = require('../icons/icons8-depot-80.png');

class HydroponicControl extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Hydroponic Control',
            systemMode: props.systemMode,
            component: 'hydroponicControl'
        };

        this.handleClick = this.handleClickOff.bind(this);
        this.handleClick = this.handleClickAuto.bind(this);
        this.handleClick = this.handleClickManualPumpOn.bind(this);
        this.handleClick = this.handleClickManualPumpOff.bind(this);
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

    handleClickOff() {
            this.socket.emit('hydroponicMode', 1);
    };

    handleClickAuto() {
            this.socket.emit('hydroponicMode', 2);
    };

    handleClickManualPumpOn() {
            this.socket.emit('hydroponicMode', 3);
    };

    handleClickManualPumpOff() {
            this.socket.emit('hydroponicMode', 4);
    };

    render() {
        return (
            <div className='row align-items-center justify-content-center'>
                <div id='hydroponicButton'>
                    <button 
                        onClick={this.handleClickOff}
                    >
                        {this.state.systemMode === 1 ?
                            <span className="badge badge-danger notify-badge">Off</span> :
                            <span className="badge badge-success notify-badge">Off</span>
                        }

                        <img src={this.state.systemMode === 1 ? garageIconOpen : garageIconClosed} alt="" width="240" height="240" />
                    </button>
                    
                    <button 
                        onClick={this.handleClickAuto}
                    >
                        {this.state.systemMode === 2 ?
                            <span className="badge badge-danger notify-badge">Auto</span> :
                            <span className="badge badge-success notify-badge">Auto</span>
                        }

                        <img src={this.state.systemMode === 2 ? garageIconOpen : garageIconClosed} alt="" width="240" height="240" />
                    </button>
                                        
                    <button 
                        onClick={this.handleClickManualPumpOn}
                    >
                        {this.state.systemMode === 3 ?
                            <span className="badge badge-danger notify-badge">Manual Pump On</span> :
                            <span className="badge badge-success notify-badge">Manual Pump on</span>
                        }

                        <img src={this.state.systemMode === 3 ? garageIconOpen : garageIconClosed} alt="" width="240" height="240" />
                    </button>
                                        
                    <button 
                        onClick={this.handleClickManualPumpOff}
                    >
                        {this.state.systemMode === 4 ?
                            <span className="badge badge-danger notify-badge">Manual Pump Off</span> :
                            <span className="badge badge-success notify-badge">Manual Pump Off</span>
                        }

                        <img src={this.state.systemMode === 4 ? garageIconOpen : garageIconClosed} alt="" width="240" height="240" />
                    </button>



                </div>
            </div>
        );
    }
}

export default HydroponicControl;
