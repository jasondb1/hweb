import React, {Component} from 'react';
//import api from "../api";
import OnOff from "./OnOffButton";

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
                <OnOff label='Relay 1' component='relay1'/>
                <OnOff label='Relay 2' component='relay2'/>
            </div>
        );
    };
}

export default Controls;
