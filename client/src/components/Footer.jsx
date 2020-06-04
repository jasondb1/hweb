import React, { Component } from 'react';
import { getAuthSocket } from "../services/socket";

//const coolingIcon = require('../icons/icons8-cooling-50-2.png');
//const heatingIcon = require('../icons/icons8-heating-50-2.png');
//const connectedIcon = require('../icons/icons8-connected-80.png');
//const disconnectedIcon = require('../icons/icons8-disconnected-80.png');
//const alertIcon = require('../icons/icons8-box-important-50.png');
//const thermometerIcon = require('../icons/icons8-thermometer-50-2.png');

const ListItems = (props) => {
    //TODO: conditional display of icons
    return ( <div>
            {/*
        <img src={coolingIcon} alt="" width="32" height="32" />
        <img src={heatingIcon} alt="" width="32" height="32" />
        <img src={connectedIcon} alt="" width="32" height="32" />
        <img src={disconnectedIcon} alt="" width="32" height="32" />
        <img src={alertIcon} alt="" width="32" height="32" />
        <img src={thermometerIcon} alt="" width="32" height="32" />
        8*/}
        </div>
    )
};

class Footer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            status: [],
        };
    }

    componentDidMount() {
        this.socket = getAuthSocket();
        this.socket.on('updates', (payload) => {
            this.setState({ status: payload });
        });
    };

    render() {
        return ( <div className = "footer col-12" >
            <ListItems values = { this.state.status }/> 
            </div>
        );
    }
}

export default Footer;
