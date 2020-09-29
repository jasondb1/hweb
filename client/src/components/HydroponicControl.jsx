import React, { Component } from 'react';
import { authSocket } from "../services/socket";
import './HydroponicControl.css';
import Chart from './SensorChart';
const climateIcon = require('../icons/icons8-temperature-50.png');
const humidityIcon = require('../icons/icons8-humidity-80.png');
const reservoirIcon = require('../icons/icons8-hygrometer-50.png');
const lightIcon = require('../icons/icons8-light-on-80.png');
const floodIcon = require('../icons/icons8-irrigation-50.png');
const lightOffIcon = require('../icons/icons8-light-off-80.png');
const upIcon = require('../icons/icons8-sort-up-50.png');
const downIcon = require('../icons/icons8-sort-down-50.png');

function pad(n) {
    return (n < 10) ? ("0" + n) : n;
}

function timeLightOnOff(value) {

    let now = Date.now();

    now += value * 1000;
    now = new Date(now);

    return now;
}

// function timeLightOn(secondsToLightOff, lightDuration) {

//         let now = Date.now();

//         now += secondsToLightOff * 1000; //calculate when light goes on
//         now -= lightDuration;
//         now += 86400000; //add one day

//         now = new Date(now);

//         return now;
// }

class HydroponicControl extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Hydroponic Control',
            component: 'hydroponicControl',
            status: { hydroponicControl: {} }
        };

        this.handleClickOff = this.handleClickOff.bind(this);
        this.handleClickAuto = this.handleClickAuto.bind(this);
        this.handleClickManualPumpOn = this.handleClickManualPumpOn.bind(this);
        this.handleClickManualPumpOff = this.handleClickManualPumpOff.bind(this);
    }

    componentDidMount() {

        //this.socket = getAuthSocket();
        this.socket = authSocket();

        this.socket.on('componentStatusUpdate', (data) => {
            this.setState(data);
            //this.setState({ systemMode: data.systemMode});
        });

        this.socket.on('updates', (payload) => {
            this.setState({ status: payload });
            //console.log(payload);
            //console.log(this.state);

        });
    }

    componentWillUnmount() {
        this.socket.close();
    }

    handleClickOff() {
        //console.log(this.socket);
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

    handleClickButton(value) {
        //console.log(value);
        this.socket.emit('hydroponicCommand', value);
    }

    render() {
        return (
            <div className='row align-items-center justify-content-center'>

                <div className='mt-2 col-12'>
                    <ul className='status-list'>
                        <li><img className="mr-3" src={climateIcon} alt="" width="40"
                            height="40" /> {this.state.status.hydroponicTemperature} &#8451;</li>
                        <li><img className="mr-3" src={humidityIcon} alt="" width="40"
                            height="40" /> {this.state.status.hydroponicHumidity} %
                        </li>
                        <li>
                            <img className="mr-3" src={lightIcon} alt="" width="40"
                                height="40" />
                            {this.state.status.hydroponicLightLevel}
                        </li>
                        <li><img  className="mr-3" src={reservoirIcon} alt="" width="40"
                            height="40" /> 
                            {this.state.status.hydroponicReservoirDepth} mm
                        </li>
                        <li>
                            <img className="mr-3" src={floodIcon} alt="" width="40"
                                height="40" />
                            {this.state.status.hydroponicPumpStatus === 0 ? <span className="badge badge-danger">OFF</span> : <span className="badge badge-success">ON</span>}
                        </li>
                        <li>
                            <img className="mr-3" src={lightOffIcon} alt="" width="40"
                                height="40" />
                            {this.state.status.hydroponicLightStatus === 0 ? <span className="badge badge-danger">OFF</span> : <span className="badge badge-success">ON</span>}
                        </li>
                       <li>
                            Light {this.state.status.hydroponicControl.lightStatus === 0 ? "On" : "Off"}: {Math.floor(this.state.status.hydroponicControl.secondsToLightOnOff / 3660)}:{pad(Math.floor(this.state.status.hydroponicControl.secondsToLightOnOff % 3600 / 60))} Hours
                            <br /> ({timeLightOnOff(this.state.status.hydroponicControl.secondsToLightOnOff).toLocaleString()})
                    </li>
                    </ul>
                </div>
                <div className='col-12' id='hydroponicButton'>
                    <hr />
                    <button
                        onClick={this.handleClickOff}
                        className={this.state.status.hydroponicMode === 1 ? "selected" : "notSelected"}
                    >
                        <span>OFF</span>
                    </button>

                    <button
                        onClick={this.handleClickAuto}
                        className={this.state.status.hydroponicMode === 2 ? "selected" : "notSelected"}
                    >
                        <span>AUTO</span>
                    </button>
                    <br />
                    <button
                        onClick={this.handleClickManualPumpOn}
                        className={this.state.status.hydroponicMode === 3 ? "selected" : "notSelected"}
                    >
                        <span>MANUAL - PUMP ON</span>
                    </button>

                    <button
                        onClick={this.handleClickManualPumpOff}
                        className={this.state.status.hydroponicMode === 4 ? "selected" : "notSelected"}
                    >
                        <span>MANUAL - PUMP OFF</span>
                    </button>

                    <hr />

                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 12)}
                    >
                        <span>-15</span>
                        <img src={downIcon} alt="" width="20"
                            height="20" />
                    </button>
                    <span className="buttonLabel">Light Cycle Start</span>
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 11)}
                    >
                        <img src={upIcon} alt="" width="20"
                            height="20" />
                        <span>+15</span>
                    </button>

                    <br />
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 6)}
                    >
                        <span>-15</span>
                        <img src={downIcon} alt="" width="20"
                            height="20" />
                    </button>
                    <span className="buttonLabel">{this.state.status.hydroponicControl.lightDuration / 60} hrs Light On Duration</span>
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 5)}
                    >
                        <img src={upIcon} alt="" width="20"
                            height="20" />
                        <span>+15</span>
                    </button>
                    <br />

                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 8)}
                    >
                        <span>-5</span>
                        <img src={downIcon} alt="" width="20"
                            height="20" />
                    </button>
                    <span className="buttonLabel">{this.state.status.hydroponicControl.floodInterval} min Pump Cycle</span>
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 7)}
                    >
                        <img src={upIcon} alt="" width="20"
                            height="20" />
                        <span>+5</span>
                    </button>

                    <br />
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 10)}
                    >
                        <span>-1</span>
                        <img src={downIcon} alt="" width="20"
                            height="20" />
                    </button>
                    <span className="buttonLabel">{this.state.status.hydroponicControl.floodDuration} min Pump Duration</span>
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 9)}
                    >
                        <img src={upIcon} alt="" width="20"
                            height="20" />
                        <span>+1</span>
                    </button>

                    <br />
                    <hr />
                    <h3>Temperature</h3>
                    <Chart sensor="hydroponicTemperature" />
                    <hr />
                    <h3>Humidity</h3>
                    <Chart sensor="hydroponicHumidity" />
                    <hr />
                    <h3>Reservoir Depth</h3>
                    <Chart sensor="hydroponicReservoirDepth" />
                </div>
            </div>
        );
    }
}

export default HydroponicControl;
