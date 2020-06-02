import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";
import './HydroponicControl.css';
import Chart from './Chart';

function pad(n) {
            return (n < 10) ? ("0" + n) : n;
}

function timeLightOff(value) {

        let now = Date.now();

        now += value * 1000;
        now = new Date(now);

        return now;
}


class HydroponicControl extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Hydroponic Control',
            component: 'hydroponicControl',
            status: {}
        };
	    
        this.handleClickOff = this.handleClickOff.bind(this);
        this.handleClickAuto = this.handleClickAuto.bind(this);
        this.handleClickManualPumpOn = this.handleClickManualPumpOn.bind(this);
        this.handleClickManualPumpOff = this.handleClickManualPumpOff.bind(this);
    }

    componentDidMount() {

        this.socket = getAuthSocket();
        
        this.socket.on('componentStatusUpdate', (data) => {
		    this.setState(data);
		    //this.setState({ systemMode: data.systemMode});
        });

		this.socket.on('updates', (payload) => {
		this.setState({status: payload});
            //console.log(payload);
            //console.log(this.state);
		
        });
    }

    componentWillUnmount() {
        this.socket.close();
    }

    handleClickOff() {
	    //console.log(this.socket);
            this.socket.emit('hydroponicMode', 1 );
    };

    handleClickAuto() {
            this.socket.emit('hydroponicMode', 2 );
    };

    handleClickManualPumpOn() {
            this.socket.emit('hydroponicMode', 3 );
    };

    handleClickManualPumpOff() {
            this.socket.emit('hydroponicMode', 4 );
    };

    handleClickButton(value) {
        console.log(value);
        this.socket.emit('hydroponicCommand', value);
    }

    render() {
        return (
            <div className='row align-items-center justify-content-center'>
                <div id='hydroponicButton'>
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
                    <ul>
                    <li>
                        Temperature: {this.state.status.hydroponicTemperature}
                    </li>
                    <li>
                        Humidity: {this.state.status.hydroponicHumidity}
                    </li>
                    <li>
                        Light Level: {this.state.status.hydroponicLightLevel}
                    </li>
                    <li>
                        Pump Status: {this.state.status.hydroponicPumpStatus === 0 ? <span className="badge badge-danger">OFF</span> : <span className="badge badge-success">ON</span> }
                    </li>
                    <li>
                        Light Status: {this.state.status.hydroponicLightStatus === 0 ? <span className="badge badge-danger">OFF</span> : <span className="badge badge-success">ON</span> }
                    </li>
                    <li>
                        Light Off In: {Math.floor(this.state.status.hydroponicCycleOn / 3660)}:{pad(Math.floor(this.state.status.hydroponicCycleOn % 3600 / 60))}
                        <br /> ({timeLightOff(this.state.status.hydroponicCycleOn).toString()})
                    </li>
                    </ul>
                    <hr />
                    
                    <button 
                        onClick={this.handleClickButton.bind(this, 12)}
                    >
		            <span>-15 Light Start</span>
                    </button>

                    <button 
                        onClick={this.handleClickButton.bind(this, 11)}
                    >
		            <span>+15 Light Start</span>
                    </button>
                
                <br/>
                    <button 
                        onClick={this.handleClickButton.bind(this, 6)}
                    >
		            <span>-15 Light Duration</span>
                    </button>
                    
                <button 
                        onClick={this.handleClickButton.bind(this, 5)}
                    >
		            <span>+15 Light Duration</span>
                    </button>
                   <br/> 
                    <button 
                        onClick={this.handleClickButton.bind(this, 8)}
                    >
		            <span>-5 Pump Cycle</span>
                    </button>
                    
                    <button 
                        onClick={this.handleClickButton.bind(this, 7)}
                    >
		            <span>+5 Pump Cycle</span>
                    </button>
                    <br/>
                    <button 
                        onClick={this.handleClickButton.bind(this, 10)}
                    >
		            <span>-5 min Flood Cycle Interval</span>
                    </button>
                    
                    <button 
                        onClick={this.handleClickButton.bind(this, 9)}
                    >
		            <span>+5 Flood Cycle Interval</span>
                    </button>
                
                    <br/>
                    <h2>Temperature</h2>
                    <Chart sensor="hydroponicTemperature"/>
                    <h2>Humidity</h2>
                    <Chart sensor="hydroponicHumidity"/>
                </div>
            </div>
        );
    }
}

export default HydroponicControl;
