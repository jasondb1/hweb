import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './Database.css';

const homeicon = require('../icons/icons8-home-50.png');
const dashboardicon = require('../icons/icons8-dashboard-50.png');
const garageicon = require('../icons/icons8-garage-50-7.png');
const climateicon = require('../icons/icons8-temperature-50.png');
const hydroponicicon = require('../icons/icons8-temperature-50.png');
const databaseicon = require('../icons/icons8-dashboard-50.png');
const othericon = require('../icons/icons8-content-50.png');
//const adminicon = require('../icons/icons8-user-group-50.png');
//const logouticon = require('../icons/icons8-exit-50.png');

class Database extends Component {

    render() {
        return (<div className='Database'>

            <ul>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/main/" ><img alt="" className="icon mr-4" src={homeicon} height='32' />Home</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/farm" ><img alt="" className="icon mr-4" src={dashboardicon} height='32' />Farm</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/beds" ><img alt="" className="icon mr-4" src={garageicon} height='32' />Beds</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/harvest" ><img alt="" className="icon mr-4" src={garageicon} height='32' />Harvest</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/crops" ><img alt="" className="icon mr-4" src={hydroponicicon} height='32' />Crops</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/planting" ><img alt="" className="icon mr-4" src={databaseicon} height='32' />Planting</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/main/weather" ><img alt="" className="icon mr-4" src={climateicon} height='32' />Weather</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/main/test" ><img alt="" className="icon mr-4" src={othericon} height='32' />Other Controls</Link>
                </li>
            </ul>
        </div>
        )
    };
}

export default Database