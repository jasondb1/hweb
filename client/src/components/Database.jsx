import React, {Component} from 'react';
import Farm from './Farm';

class Database extends Component {

    render() {
        return (<div className='Database'>
                <Farm {...this.props} />
               
            </div>
        )
    };
}

export default Database