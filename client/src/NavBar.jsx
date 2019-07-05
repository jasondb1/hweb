import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = (props) => {
	return (
		<div className='NavBar'>
			<Link to="/">Home</Link>
			{props.currentUser
				? (
					<span>
						<Link to="/vip">VIP</Link>
						<Link to="/dashboard">Dashboard</Link>
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

export default NavBar;
