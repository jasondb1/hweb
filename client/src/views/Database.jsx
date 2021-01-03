import React, {Component} from 'react';
import {Route} from 'react-router-dom'

import Header from "../components/Header";
import Navmenu from "../components/Navmenu";
import Usermenu from "../components/Usermenu";
import Database from "../components/Database";
import Footer from "../components/Footer";
import httpClient from '../services/httpClient';
import Farm from "../components/DatabaseFarm";
import Beds from "../components/DatabaseBeds";
import Harvest from "../components/DatabaseHarvest";

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
                        <Route path={`${match.path}/`} {...this.props} component={Database} exact/>
                        <Route path={`${match.path}/farm`} {...this.props} component={Farm}/>
                        <Route path={`${match.path}/beds`} {...this.props} component={Beds}/>
                        <Route path={`${match.path}/harvest`} {...this.props} component={Harvest}/>

                    </div>
                </div>
                <Footer/>
            </div>
        )
    };

}

export default Main
