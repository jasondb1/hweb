import React from 'react';
import {Link} from 'react-router-dom';
import './Usermenu.css';
import {getAuthSocket} from "../services/socket";

const homeicon = require('../icons/icons8-home-50.png');
const dashboardicon = require('../icons/icons8-dashboard-50.png');
//const othericon = require('../icons/icons8-content-50.png');
const adminicon = require('../icons/icons8-user-group-50.png');
const logouticon = require('../icons/icons8-exit-50.png');

const exportData = () => {
    console.log ("export data");
    socket = getAuthSocket();
    socket.emit('exportData', "");

}

const Usermenu = (props) => {
    return (
        <div className='UserMenu nav flex-column nav-pills' id='v-pills-tab'>

            {props.currentUser
                ? (<div>
                <Link className='nav-link' to="/" onClick={props.toggleUserMenu}><img alt="" className="icon" src={homeicon} height='32' />Home</Link>
                <Link className='nav-link' to="/main/dashboard" onClick={props.toggleUserMenu}><img alt="" className="icon" src={dashboardicon} height='32' />Change Password</Link>
                <Link className='nav-link' to="/main/dashboard" onClick={ exportData()}><img alt="" className="icon" src={dashboardicon} height='32' />Export Log Data</Link>
                <Link className='nav-link' to="/main/dashboard" onClick={props.toggleUserMenu}><img alt="" className="icon" src={dashboardicon} height='32' />Clear Log Data</Link>
                        
                        {props.isAdmin ?
                            <Link className='nav-link' to="/main/admin" onClick={props.toggleNavMenu}><img alt="" className="icon" src={adminicon} height='32'/>Admin</Link> 
                            : null
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

export default Usermenu;
