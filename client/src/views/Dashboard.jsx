import React, {Component} from 'react';
import { authenticate } from '../services/socket';

import Controls from "../components/Controls";
import Status from "../components/Status";


class Dashboard extends Component {

    componentWillUnmount(){
        authenticate();
    }



    render() { return (<div className='Dashboard'>
            <Controls/>
            <Status/>
        </div>
    )};

}

export default Dashboard
