import React, {Component} from 'react';

import Controls from "../components/Controls";
import Status from "../components/Status";


class Dashboard extends Component {

    render() { return (<div className='Dashboard'>
            <Controls/>
            <Status/>
        </div>
    )};

}

export default Dashboard
