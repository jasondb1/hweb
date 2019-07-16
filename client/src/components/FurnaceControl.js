import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";
import './FurnaceControl.css';
//import OnOff from "./OnOffButton";
import EnableDisableButton from "./EnableDisableButton";
import OffAutoButton from "./OffAutoButton";

const climateIcon = require('../icons/icons8-temperature-50.png');
const humidityIcon = require('../icons/icons8-humidity-80.png');
const leftArrowIcon = require('../icons/icons8-sort-down-50.png');
const rightArrowIcon = require('../icons/icons8-sort-up-50.png');

class IndoorClimateSummary extends Component {

    constructor(props) {
        super(props);

        this.state = {
            status: [],
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        this.socket = getAuthSocket();

        this.socket.on('updates', (payload) => {
            this.setState({status: payload});
        });

        this.socket.on('statusUpdate', (data) => {
            this.setState({data});
        });
    };

    componentWillUnmount() {
        this.socket.close();
    }

    handleClick(event) {
        this.socket.emit(event, this.state.component);
    };

    render() {
        return (
            <div className='row align-items-center justify-content-center'>
                    <div className='mt-2 col-12'>
                    <ul className='status-list'>
                        <li><img src={climateIcon} alt="" width="40"
                                 height="40"/> {this.state.status.temp_local} &#8451;</li>
                        <li><img src={humidityIcon} alt="" width="40"
                                 height="40"/> {this.state.status.humidity_local} %
                        </li>
                    </ul>
                    </div>

                <div className='mt-3 col-12'>
                    <hr />
                    <div id='furnaceControl'>
                        <button className='control-button' onClick={this.handleClick.bind(this, 'temperatureDown')}><img
                            src={leftArrowIcon} alt="" width="80" height="80"/></button>
                        <div className='up-down-control'>
                            <span className="badge up-down-value">{this.state.status.heatingTemperature}&#8451;</span>
                            <img src={climateIcon} alt="" width="150" height="150"/>
                        </div>
                        <button className='control-button' onClick={this.handleClick.bind(this, 'temperatureUp')}><img
                            src={rightArrowIcon} alt="" width="80" height="80"/></button>
                    </div>
                    <hr />
                </div>
                <div className='mt-3 col-12'>

                    <OffAutoButton label='Furnace Fan' component='furnaceFanMode' eventString='fanOn' />
                    <EnableDisableButton label='Enable Heat' component='heatingEnabled' eventString='enableHeat'/>
                    <EnableDisableButton label='Enable Cooling' component='coolingEnabled' eventString='enableCooling'/>


                    <p>fan running: {this.state.status.furnaceFanStatus}</p>
                    <p>Furnace function: {this.state.status.furnaceStatus}</p>
                    <p>TODO: set schedule</p>
                    <p>TODO: history</p>

                </div>
            </div>
        );
    }
}

export default IndoorClimateSummary;
