import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";
const HydroponicIcon = require('../icons/icons8-irrigation-50.png');

class HydroponicSummary extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: 'Hydroponic',
            systemMode: props.systemMode,
            component: 'Hydroponic Arduino'
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {

        this.socket = getAuthSocket();

        //TODO: This should be a door sensor
        this.socket.on('componentStatusUpdate', (data) => {
            
                console.log("update sensor in hydroponic summary");
                console.log(data);
                if (data.component === this.state.component) {
                this.setState({systemMode: data.systemMode});
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
				                    {this.state.systemMode === 1 ?
                                        <span className="badge badge-danger">Off</span> :
					                    this.state.systemMode === 2 ?
                                    	 <span className="badge badge-success">Auto</span> :
					 	                this.state.systemMode === 3 ?
                                    	<span className="badge badge-success">Manual Pump On</span> :
                                		this.state.systemMode === 4 ?
                                    	<span className="badge badge-success">Manual Pump Off</span> :
                                    	<span className="badge badge-danger">Error</span>
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

export default HydroponicSummary;
