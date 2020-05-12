import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";
import './HydroponicControl.css';
//const garageIconClosed = require('../icons/icons8-warehouse-80.png');
//const garageIconOpen = require('../icons/icons8-depot-80.png');

class HydroponicControl extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Hydroponic Control',
            systemMode: props.systemMode,
            component: 'hydroponicControl'
        };
	    
        this.handleClickOff = this.handleClickOff.bind(this);
        this.handleClickAuto = this.handleClickAuto.bind(this);
        this.handleClickManualPumpOn = this.handleClickManualPumpOn.bind(this);
        this.handleClickManualPumpOff = this.handleClickManualPumpOff.bind(this);
    }

    componentDidMount() {

        this.socket = getAuthSocket();
	//console.log(this.socket);

        //this.socket.on('statusUpdate', (data) => {
        this.socket.on('componentStatusUpdate', (data) => {
            console.log("received update on hydro mode");
		console.log (data);
		this.setState(data);
		//this.setState({ systemMode: data.systemMode});
		console.log(this.state);
        });

		this.socket.on('updates', (payload) => {
			this.setState({status: payload});
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

    render() {
        return (
            <div className='row align-items-center justify-content-center'>
                <div id='hydroponicButton'>
                    <button 
                        onClick={this.handleClickOff}
		                className={this.state.systemMode === 1 ? "selected" : "notSelected"}
                    >
		            <span>OFF</span>
                    </button>
                    
                    <button 
                        onClick={this.handleClickAuto}
		                className={this.state.systemMode === 2 ? "selected" : "notSelected"}
                    >
		            <span>AUTO</span>
                    </button>
                                        
                    <button 
                        onClick={this.handleClickManualPumpOn}
		                className={this.state.systemMode === 3 ? "selected" : "notSelected"}
                    >
		            <span>MANUAL - PUMP ON</span>
                    </button>
                                        
                    <button 
                        onClick={this.handleClickManualPumpOff}
		                className={this.state.systemMode === 4 ? "selected" : "notSelected"}
                    >
		            <span>MANUAL - PUMP OFF</span>
                    </button>

                </div>
            </div>
        );
    }
}

export default HydroponicControl;
