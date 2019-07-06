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
                <OnOff label='LED' component='led'/>
                <OnOff label='LED1' component='led1'/>
                <OpenClose label='Garage' component='garageRelay'/>
                <OnOff label='Relay 1' component='relay1'/>
                <OnOff label='Relay 2' component='relay2'/>
            </div>
        );
    };
}

export default Controls;
