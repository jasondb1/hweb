import React, {Component} from 'react';

const coolingIcon = require('../icons/icons8-cooling-50-2.png');
const heatingIcon = require('../icons/icons8-cooling-50-2.png');
const connectedIcon = require('../icons/icons8-cooling-50-2.png');
const disconnectedIcon = require('../icons/icons8-cooling-50-2.png');
const alertIcon = require('../icons/icons8-cooling-50-2.png');
const thermometerIcon = require('../icons/icons8-cooling-50-2.png');

const UPDATEINTERVAL = 10000;

const ListItems = (props) => {
    //TODO: conditional display of icons
    return (
        <div>
        <img src={coolingIcon} alt="" width="80" height="80" />
        <img src={heatingIcon} alt="" width="80" height="80"/>
        <img src={connectedIcon} alt="" width="80" height="80"/>
        <img src={alertIcon} alt="" width="80" height="80"/>
        <img src={thermometerIcon} alt="" width="80" height="80"/>
        </div>
    )
};

class Footer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: props.status,
        };
    }

    render() {
        return (
                <div className="footer col-12">
                    <ListItems values={this.state.status}/>
                </div>
        );
    }
}

export default Footer;
