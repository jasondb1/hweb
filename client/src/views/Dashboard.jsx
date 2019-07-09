import React, {Component} from 'react';
import {authenticate, subscribeToUpdates} from '../services/socket';

import Controls from "../components/Controls";
import Status from "../components/Status";


class Dashboard extends Component {

    componentWillMount(){
        console.log('Dashboard - Authenticate socket');
        authenticate();
        subscribeToUpdates((err, payload) => this.setState({status: payload}));

    }



    render() { return (<div className='Dashboard'>
            <Controls/>
            <Status/>
        </div>
    )};

}

export default Dashboard
