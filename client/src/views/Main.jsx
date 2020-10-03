import React, {Component} from 'react';
import {Route} from 'react-router-dom'

import Header from "../components/Header";
import Navmenu from "../components/Navmenu";
import Usermenu from "../components/Usermenu";
import Garage from "../components/Garage";
import Climate from "../components/Climate";
import Dashboard from "../components/Dashboard";
import Hydroponics from "../components/Hydroponic";
import SignUp from "../components/SignUp";
import Test from "../components/Test";
import Footer from "../components/Footer";
import httpClient from '../services/httpClient';

import Database from '../components/Database';

class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isAdmin: httpClient.getAdmin(),
            isNavMenuOpen: false,
            isUserMenuOpen: false,
            status: [],
        };

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
        //TODO: doors and lights routes
        const {match} = this.props;
        const {currentUser} = this.props;
        return (
            <div>
                <Header currentUser={currentUser} toggleNavMenu={this.toggleNavMenu}
                        toggleUserMenu={this.toggleUserMenu}/>

                <div className="mainMenu row ml-3" id="mainMenu">
                    {this.state.isNavMenuOpen ? (<nav>
                            <Navmenu currentUser={currentUser} isAdmin={this.state.isAdmin} toggleNavMenu={this.toggleNavMenu} />
                        </nav>
                    ) : null}
                </div>

                <div className="userMenu row ml-3" id="userMenu">
                    {this.state.isUserMenuOpen ? (<nav>
                            <Usermenu currentUser={currentUser} isAdmin={this.state.isAdmin} toggleNavMenu={this.toggleUserMenu} />
                        </nav>
                    ) : null}
                </div>

                <div className="content-main row">
                    <div className="col-12">
                        <Route path={`${match.path}/`} {...this.props} component={Dashboard} exact/>
                        <Route path={`${match.path}/dashboard`} {...this.props} component={Dashboard}/>
                        <Route path={`${match.path}/garage`} {...this.props} component={Garage}/>
                        <Route path={`${match.path}/climate`} {...this.props} component={Climate}/>
                        <Route path={`${match.path}/hydroponics`} {...this.props} component={Hydroponics}/>
                        <Route path={`${match.path}/database`} {...this.props} component={Database}/>
                        <Route path={`${match.path}/admin`} {...this.props} isAdmin={this.state.isAdmin} component={SignUp}/>
                        <Route path={`${match.path}/test`} {...this.props} component={Test}/>
                    </div>
                </div>
                <Footer/>
            </div>
        )
    };

}

export default Main
