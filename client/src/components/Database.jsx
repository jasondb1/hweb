import React, {Component} from 'react';
import GarageSummary from './GarageSummary';
import IndoorClimateSummary from './IndoorClimateSummary';
import OutdoorClimateSummary from './OutdoorClimateSummary';
import HydroponicSummary from './HydroponicSummary';
import DoorSummary from './DoorSummary';

class Database extends Component {

    render() {
        return (<div className='Database'>
                <HydroponicSummary {...this.props} />
                <GarageSummary {...this.props} />
                <DoorSummary {...this.props} />
                <IndoorClimateSummary {...this.props} />
                <OutdoorClimateSummary {...this.props} />
            </div>
        )
    };
}

export default Database