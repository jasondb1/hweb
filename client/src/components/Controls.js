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
                <OnOff label='LED1' component='ledIndicator'/>
                <OpenClose label='Garage' component='garageRelay'/>
            </div>
        );
    };
}

export default Controls;
