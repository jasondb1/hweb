import React, {Component} from 'react';
import {Route} from 'react-router-dom'

import Header from "../components/Header";
import Navmenu from "../components/Navmenu";
import Garage from "../components/Garage";
import Climate from "../components/Climate";
import Dashboard from "../components/Dashboard";
import Test from "../components/Test";


class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isNavMenuOpen: false,
            isUserMenuOpen: false
        };

        //console.log(props);
        this.toggleNavMenu = this.toggleNavMenu.bind(this);
        this.toggleUserMenu = this.toggleUserMenu.bind(this);
    }

    toggleNavMenu() {
        this.setState({isNavMenuOpen: !this.state.isNavMenuOpen});
    }

    toggleUserMenu() {
        this.setState({isUserMenuOpen: !this.state.isUserMenuOpen});
    }

    render() {
        const {match} = this.props;
        const {currentUser} = this.props;
        return (
            <div>
                <Header currentUser={currentUser} toggleNavMenu={this.toggleNavMenu}
                        toggleUserMenu={this.toggleUserMenu}/>





                <div className="mainMenu row" id="mainMenu">
                    {this.state.isNavMenuOpen ? (<nav>
                            <Navmenu currentUser={currentUser}/>
                        </nav>
                    ) : null}
                </div>

                <div className="content-main row">
                    <div className="col-12">
                        <Route path={`${match.path}/`} component={Dashboard} exact/>
                        <Route path={`${match.path}/dashboard`} component={Dashboard}/>
                        <Route path={`${match.path}/garage`} component={Garage}/>
                        <Route path={`${match.path}/climate`} component={Climate}/>
                        <Route path={`${match.path}/test`} component={Test}/>
                    </div>
                </div>

                <div className="footer col-12">
                    Footer Status icons
                </div>

            </div>
        )
    };

}

export default Main
