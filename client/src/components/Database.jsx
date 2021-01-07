import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './Database.css';

const homeicon = require('../icons/icons8-home-50.png');
//const dashboardicon = require('../icons/icons8-dashboard-50.png');
//const garageicon = require('../icons/icons8-garage-50-7.png');
//const climateicon = require('../icons/icons8-temperature-50.png');
//const hydroponicicon = require('../icons/icons8-temperature-50.png');
//const databaseicon = require('../icons/icons8-dashboard-50.png');
//const othericon = require('../icons/icons8-content-50.png');
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
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/farm" >Farm</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/beds" >Beds</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/harvest" >Harvest</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/crops" >Crops</Link>
                </li>

                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/greenhouse" >Greenhouse</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/nursery" >Nursery</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/planting" >Planting</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/bedplanning" >Bed Planning</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/bedhistory" >Bed Actions</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/alarms" >Alarms</Link>
                </li>
                <li>
                    <Link className='btn btn-lg btn-outline-primary btn-block' to="/database/sensors" >Sensors</Link>
                </li>
            </ul>
        </div>
        )
    };
}

export default Database