import React, {Component} from 'react';
import FurnaceControl from './FurnaceControl';
import ClimateChart from './ClimateChart';

class Climate extends Component {

    render() { return (<div className='Climate'>
            <h1>Climate</h1>
            <FurnaceControl />
            <ClimateChart />
        </div>
    )};

}

export default Climate
