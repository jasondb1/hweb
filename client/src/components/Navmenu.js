import React from 'react';
import { Link } from 'react-router-dom';

const Navmenu = (props) => {
    return (
        <div className='NavMenu'>
            <Link to="/">Home</Link>
            {props.currentUser
                ? (
                    <ul>
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/main/dashboard">Dashboard Main</Link></li>
                        <li><Link to="/main/garage">Garage</Link></li>
                        <li><Link to="/main/climate">Climate</Link></li>
                        <li><Link to="/main/test">Other Controls</Link></li>
                        <li><Link to="/signup">Admin</Link></li>
                        <li><Link to="/logout">Log Out</Link></li>
					</ul>
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
