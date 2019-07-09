import React, {Component} from 'react';
import OnOff from "./OnOffButton";
import OpenClose from "./OpenCloseButton";

class Controls extends Component {
    constructor() {
        super();

        this.state = {};
    };

    render() {
        return (
            <div>
                <h2>Controls</h2><br/>
                <OnOff socket = { this.props.socket } label='LED' component='led'/>
                <OnOff socket = { this.props.socket } label='LED1' component='ledIndicator'/>
                <OpenClose socket = { this.props.socket } label='Garage' component='garageRelay'/>
                <OnOff socket = { this.props.socket } label='Relay 1' component='relay1'/>
                <OnOff socket = { this.props.socket } label='Relay 2' component='relay2'/>
            </div>
        );
    };
}

export default Controls;
