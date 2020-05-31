import React, {Component} from 'react';
import GarageSummary from './GarageSummary';
import IndoorClimateSummary from './IndoorClimateSummary';
import OutdoorClimateSummary from './OutdoorClimateSummary';
import HydroponicSummary from './HydroponicSummary';
import DoorSummary from './DoorSummary';

class Dashboard extends Component {

    render() {
        return (<div className='Dashboard'>
                <GarageSummary {...this.props} />
                <DoorSummary {...this.props} />
                <IndoorClimateSummary {...this.props} />
                <OutdoorClimateSummary {...this.props} />
                <HydroponicSummary {...this.props} />
            </div>
        )
    };
}

export default Dashboard
