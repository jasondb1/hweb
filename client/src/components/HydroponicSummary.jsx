import React, {Component} from 'react';
import {authSocket} from "../services/socket";
const HydroponicIcon = require('../icons/icons8-irrigation-50.png');


class HydroponicSummary extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Hydroponic',
            systemMode: props.systemMode,
            component: 'Hydroponic Arduino',
            status: {}
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {

        //this.socket = getAuthSocket();
        this.socket = authSocket();

        this.socket.on('updates', (payload) => {
            this.setState({status: payload});
            console.log(this.state);
        });

        this.socket.on('componentStatusUpdate', (data) => {
                //console.log("update sensor in hydroponic summary");
                //console.log(data);
                if (data.component === this.state.component) {
                    this.setState({hydroponicMode: data.hydroponicMode});
            }
        });
    }

    componentWillUnmount() {
        this.socket.close();
    }

    handleClick() {
        this.props.history.push('/main/hydroponics');
    };

    render() {
        return (
            <div className='card border-primary mt-3' onClick={this.handleClick}>
                <div className="row no-gutters d-inline-flex">
                    <div className="p-1 summary-icon">
                        <img src={HydroponicIcon} alt="" width="80" height="80" />


                    </div>
                    <div className="">
                        <div className="card-body">
                            <h5 className="card-title mt-md-2">Hydroponic</h5>

                            <ul className='status-list'>
                                <li>Mode:  
				                    {this.state.status.hydroponicMode === 1 ?
                                        <span className="badge badge-danger">Standby</span> :
					                    this.state.status.hydroponicMode === 2 ?
                                    	 <span className="badge badge-success">Auto</span> :
					 	                this.state.status.hydroponicMode === 3 ?
                                    	<span className="badge badge-success">Manual Pump On</span> :
                                		this.state.status.hydroponicMode === 4 ?
                                    	<span className="badge badge-success">Manual Pump Off</span> :
                                    	<span className="badge badge-danger">Error</span>
				                    }

                                </li>
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
                                    Light Status: {this.state.status.hydroponicLightStatus === 0 ? <span className="badge badge-danger">OFF</span> : <span className="badge badge-success">ON</span> }
                                </li>
                                <li>
                                    Pump Status: {this.state.status.hydroponicPumpStatus === 0 ? <span className="badge badge-danger">OFF</span> : <span className="badge badge-success">ON</span> }
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        );
    }
}

export default HydroponicSummary;
