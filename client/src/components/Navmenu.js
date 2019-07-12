import React from 'react';
import { Link } from 'react-router-dom';

const Navmenu = (props) => {
    return (
        <div className='NavMenu'>
            <Link to="/">Home</Link>
            {props.currentUser
                ? (
                    <span>
						<Link to="/dashboard">Dashboard</Link>
                        <Link to="/main/dashboard">Dashboard Main</Link>
                        <Link to="/main/garage">Garage</Link>
                        <Link to="/main/climate">Climate</Link>
                        <Link to="/main/test">Other Controls</Link>
						<Link to="/signup">Admin</Link>
						<Link to="/logout">Log Out</Link>
					</span>
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
