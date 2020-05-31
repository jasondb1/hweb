import React from 'react';
import {Link} from 'react-router-dom';
import './Navmenu.css';

const homeicon = require('../icons/icons8-home-50.png');
const dashboardicon = require('../icons/icons8-dashboard-50.png');
const garageicon = require('../icons/icons8-garage-50-7.png');
const climateicon = require('../icons/icons8-temperature-50.png');
const hydroponicicon = require('../icons/icons8-temperature-50.png');
const othericon = require('../icons/icons8-content-50.png');
const adminicon = require('../icons/icons8-user-group-50.png');
const logouticon = require('../icons/icons8-exit-50.png');

const Navmenu = (props) => {
    return (
        <div className='NavMenu nav flex-column nav-pills' id='v-pills-tab'>

            {props.currentUser
                ? (<div>
                <Link className='nav-link' to="/" onClick={props.toggleNavMenu}><img alt="" className="icon" src={homeicon} height='32' />Home</Link>
                <Link className='nav-link' to="/main/dashboard" onClick={props.toggleNavMenu}><img alt="" className="icon" src={dashboardicon} height='32' />Dashboard</Link>
                <Link className='nav-link' to="/main/garage" onClick={props.toggleNavMenu}><img alt="" className="icon" src={garageicon} height='32' />Garage</Link>
                <Link className='nav-link' to="/main/climate" onClick={props.toggleNavMenu}><img alt="" className="icon" src={climateicon} height='32' />Climate</Link>
                <Link className='nav-link' to="/main/hydroponics" onClick={props.toggleNavMenu}><img alt="" className="icon" src={hydroponicicon} height='32' />Hydroponics</Link>
                <Link className='nav-link' to="/main/test" onClick={props.toggleNavMenu}><img alt="" className="icon" src={othericon} height='32' />Other Controls</Link>
                        {props.isAdmin ?
                            <Link className='nav-link' to="/main/admin" onClick={props.toggleNavMenu}><img alt=""
                                                                                                           className="icon"
                                                                                                           src={adminicon}
                                                                                                           height='32'/>Admin</Link> : null
                        }
                <Link className='nav-link' to="/logout" onClick={props.toggleNavMenu}><img alt="" className="icon" src={logouticon} height='32' />Log Out</Link>
                </div>
                )
                : (
                    <span>
						<Link to="/login">Log In</Link>
					</span>
                )
            }
        </div>
    )

};

export default Navmenu;
