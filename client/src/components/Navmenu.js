import React from 'react';
import {Link} from 'react-router-dom';

const Navmenu = (props) => {
    return (
        <div className='NavMenu nav flex-column nav-pills' id='v-pills-tab'>

            {props.currentUser
                ? (<div>
                <Link className='nav-link' to="/">Home</Link>
                <Link className='nav-link' to="/dashboard">Dashboard</Link>
                <Link className='nav-link' to="/main/dashboard">Dashboard Main</Link>
                <Link className='nav-link' to="/main/garage">Garage</Link>
                <Link className='nav-link' to="/main/climate">Climate</Link>
                <Link className='nav-link' to="/main/test">Other Controls</Link>
                <Link className='nav-link' to="/signup">Admin</Link>
                <Link className='nav-link' to="/logout">Log Out</Link>
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
