//import { Timestamp } from 'bson';
import React, { Component } from 'react';
import { authSocket } from "../services/socket";
import './HydroponicControl.css';
//import Chart from './SensorChart';
import Chart from './SensorChartAlt';
const climateIcon = require('../icons/icons8-temperature-50.png');
const humidityIcon = require('../icons/icons8-humidity-80.png');
const reservoirIcon = require('../icons/icons8-hygrometer-50.png');
const lightIcon = require('../icons/icons8-light-on-80.png');
const floodIcon = require('../icons/icons8-irrigation-50.png');
const lightOffIcon = require('../icons/icons8-light-off-80.png');
//const upIcon = require('../icons/icons8-sort-up-50.png');
//const downIcon = require('../icons/icons8-sort-down-50.png');

function pad(n) {
    return (n < 10) ? ("0" + n) : n;
}

function timeLightOnOff(value) {

    let now = Date.now();

    now += value * 1000;
    now = new Date(now);

    return (now.getHours() + ':' + pad(now.getMinutes()));
}

class HydroponicControl extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Hydroponic Control',
            component: 'hydroponicControl',
            status: { hydroponicControl: {lightStatus: false, } },
            //data: {},
            chartData: {},
            lightStatus: null,
            chartTime: 60
        };

        this.dataArray = {};

        this.handleClickOff = this.handleClickOff.bind(this);
        this.handleClickAuto = this.handleClickAuto.bind(this);
        this.handleClickManualPumpOn = this.handleClickManualPumpOn.bind(this);
        this.handleClickManualPumpOff = this.handleClickManualPumpOff.bind(this);
    }

    componentDidMount() {
        this.socket = authSocket();

        //get cached data
        //this.dataArray = JSON.parse(localStorage.getItem('sensorData'));
        //get sensor data from at last timestamp to current
        // if (this.dataArray){
        // let newestDate = JSON.stringify(this.dataArray.reduce(function(prev, current) { 
        //             return (prev.Timestamp > current.Timestamp) ? prev : current 
        //         }));
        // this.socket.emit('requestMultipleSensorData', {sensors:['hydroponicHumidity', 'hydroponicTemperature', 'hydroponicReservoirDepth'], time: newestDate.Timestamp} );
        // } else {
        //this.socket.emit('requestMultipleSensorData', { sensors: ['hydroponicHumidity', 'hydroponicTemperature', 'hydroponicReservoirDepth'], timeBack: 1440 });
        this.socket.emit('requestMultipleSensorData', { sensors: ['hydroponicHumidity', 'hydroponicTemperature', 'hydroponicReservoirDepth'], timeBack: this.state.chartTime });

        this.socket.on('incomingMultipleSensorData', (payload) => {
            //console.log(payload);

            this.dataArray = [];

            for (let element of payload) {
                if (this.dataArray[element.Sensor]) {
                    this.dataArray[element.Sensor].push(element);
                } else {
                    this.dataArray[element.Sensor] = [element];
                }
            }

            this.setState({ chartData: this.dataArray });

        });

        this.socket.on('componentStatusUpdate', (data) => {
            this.setState(data);
            //this.setState({ systemMode: data.systemMode});
        });

        this.socket.on('updates', (payload) => {
            //this.setState({ status: payload });
            //console.log("update:")

            let sensorKeys = ['hydroponicHumidity', 'hydroponicTemperature', 'hydroponicReservoirDepth'];
            let incomingData;

            for (let key of sensorKeys) {
                incomingData = {
                    Timestamp: payload.ts,
                    Sensor: key,
                    Value: payload[key],
                };

                if (this.dataArray[key] && this.dataArray[key].length > 0) {
                    this.dataArray[key].push(incomingData);
                }
            }

            this.setState({ status: payload, chartData: this.dataArray });

        });
    }

    componentWillUnmount() {
        this.socket.close();

        //set cache storage
        localStorage.setItem('sensorData', JSON.stringify(this.dataArray));
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

    handleClickButton(value) {
        this.socket.emit('hydroponicCommand', value);
    }

    handleClickButtonTime(value) {
        this.setState({chartTime: value});
        this.socket.emit('requestMultipleSensorData', { sensors: ['hydroponicHumidity', 'hydroponicTemperature', 'hydroponicReservoirDepth'], timeBack: value });
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
                        <li><img className="mr-3" src={reservoirIcon} alt="" width="40"
                            height="40" />
                            {this.state.status.hydroponicReservoirDepth} cm
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
                            Light {this.state.status.hydroponicControl.lightStatus === 0 ? "On" : "Off"} in: {Math.floor(this.state.status.hydroponicControl.secondsToLightOnOff / 3660)}:{pad(Math.floor(this.state.status.hydroponicControl.secondsToLightOnOff % 3600 / 60))} Hours
                             ({timeLightOnOff(this.state.status.hydroponicControl.secondsToLightOnOff)})
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

                    </button>
                    <span className="buttonLabel">Light Cycle Start</span>
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 11)}
                    >

                        <span>+15</span>
                    </button>

                    <br />
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 6)}
                    >
                        <span>-15</span>
                    </button>
                    <span className="buttonLabel">{this.state.status.hydroponicControl.lightDuration / 60} hrs Light On Duration</span>
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 5)}
                    >
                        <span>+15</span>
                    </button>
                    <br />

                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 8)}
                    >
                        <span>-5</span>
                    </button>
                    <span className="buttonLabel">{this.state.status.hydroponicControl.floodInterval} min Pump Cycle</span>
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 7)}
                    >
                        <span>+5</span>
                    </button>

                    <br />
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 10)}
                    >
                        <span>-1</span>
                    </button>
                    <span className="buttonLabel">{this.state.status.hydroponicControl.floodDuration} min Pump Duration</span>
                    <button className="smallButton"
                        onClick={this.handleClickButton.bind(this, 9)}
                    >
                        <span>+1</span>
                    </button>

                    <br />
                    <hr />
                    <button style={{ padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                        className={this.state.chartTime === 10080 ? "selected" : "notSelected"}
                        onClick={this.handleClickButtonTime.bind(this, 10080)}
                    >1 week
                </button>
                    <button style={{ padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                        className={this.state.chartTime === 1440 ? "selected" : "notSelected"}
                        onClick={this.handleClickButtonTime.bind(this, 1440)}
                    >24 hours
                </button>
                    <button style={{ padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                        className={this.state.chartTime === 720 ? "selected" : "notSelected"}
                        onClick={this.handleClickButtonTime.bind(this, 720)}
                    >12 hour
                </button>
                    <button style={{ padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                        className={this.state.chartTime === 360 ? "selected" : "notSelected"}
                        onClick={this.handleClickButtonTime.bind(this, 360)}
                    >6 hour
                </button>
                    <button style={{ padding: "0.3em", marginLeft: "0.7em", width: "6em" }}
                        className={this.state.chartTime === 60 ? "selected" : "notSelected"}
                        onClick={this.handleClickButtonTime.bind(this, 60)}
                    >1 hour</button>
                    <br />
                    <hr />
                    <div></div>
                    <h3>Temperature</h3>
                    <Chart sensor="hydroponicTemperature" data={this.state.chartData.hydroponicTemperature} timeback={1440} />
                    <h3>Humidity</h3>
                    <Chart sensor="hydroponicHumidity" data={this.state.chartData.hydroponicHumidity} timeback={1440} />
                    <hr />
                    <h3>Reservoir Depth</h3>
                    <Chart sensor="hydroponicReservoirDepth" data={this.state.chartData.hydroponicReservoirDepth} timeback={1440} />
                </div>
            </div>
        );
    }
}

export default HydroponicControl;
