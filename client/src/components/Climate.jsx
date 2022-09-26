import React, {Component} from 'react';
import FurnaceControl from './FurnaceControl';
import Chart from './SensorChart';

class Climate extends Component {



    render() { return (<div className='Climate'>
            <h1>Climate</h1>
            <FurnaceControl />
            <Chart sensor="temp_local"/>
        </div>
    )};

}

export default Climate
