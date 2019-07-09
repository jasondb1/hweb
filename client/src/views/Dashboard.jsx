import React, {Component} from 'react';

import Controls from "../components/Controls";
import Status from "../components/Status";


class Dashboard extends Component {


    componentDidMount(){
        this.socket = authenticate();
        //subscribeToUpdates((err, payload) => this.setState({status: payload}));
    }



    render() { return (<div className='Dashboard'>
            <Controls socket = { this.socket } />
            <Status/>
        </div>
    )};

}

export default Dashboard
