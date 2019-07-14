import React, {Component} from 'react';
import GarageSummary from './GarageSummary';
import IndoorClimateSummary from './IndoorClimateSummary';
import OutdoorClimateSummary from './OutdoorClimateSummary';
import DoorSummary from './DoorSummary';

class Dashboard extends Component {

    render() {
        return (<div className='Dashboard'>
                <GarageSummary {...this.props} />
                <DoorSummary {...this.props} />
                <IndoorClimateSummary {...this.props} />
                <OutdoorClimateSummary {...this.props} />
            </div>
        )
    };
}

export default Dashboard
