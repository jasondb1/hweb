import React from 'react';

import Controls from "../components/Controls";
import Status from "../components/Status";

const Dashboard = (props) => {
    return (
        <div className='Dashboard'>
            <Controls/>
            <Status/>
        </div>
    )
};

export default Dashboard
