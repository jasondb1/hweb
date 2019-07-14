import React, {Component} from 'react';
import {Route} from 'react-router-dom'

import Header from "../components/Header";
import Navmenu from "../components/Navmenu";
import Garage from "../components/Garage";
import Climate from "../components/Climate";
import Dashboard from "../components/Dashboard";
import Test from "../components/Test";
import Footer from "../components/Footer";
import {getAuthSocket} from "../services/socket";
//import api from "../services/componentService";

const UPDATEINTERVAL = 10000;

class Main extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isNavMenuOpen: false,
            isUserMenuOpen: false,
            status: [],
        };

        //console.log(props);
        //this.updateStatus = this.updateStatus.bind(this);
        this.toggleNavMenu = this.toggleNavMenu.bind(this);
        this.toggleUserMenu = this.toggleUserMenu.bind(this);
    }

    componentDidMount() {
        this.socket = getAuthSocket();
        //this.subscribeToUpdates((err, payload) => {
        //    this.setState({status: payload})
        //});
    };

    componentWillUnmount() {
        //TODO: unsubscribe from updates
        //clearInterval(this.interval);
    }

    // updateStatus() {
    //     api.getStatus().then(json => {
    //         this.setState({status: json})
    //     });
    // }

    //subscribeToUpdates(callback) {
    //    this.socket.on('updates',
    //        payload => callback(null, payload)
    //    );
//console.log('subscribing to updates');
//        this.socket.emit('subscribeToUpdates', UPDATEINTERVAL);
//    }

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
                            <Navmenu currentUser={currentUser}/>
                        </nav>
                    ) : null}
                </div>

                <div className="content-main row">
                    <div className="col-12">
                        <Route path={`${match.path}/`} {...this.props} component={Dashboard} exact/>
                        <Route path={`${match.path}/dashboard`} {...this.props} component={Dashboard}/>
                        <Route path={`${match.path}/garage`} {...this.props} component={Garage}/>
                        <Route path={`${match.path}/climate`} {...this.props} component={Climate}/>
                        <Route path={`${match.path}/test`} {...this.props} component={Test}/>
                    </div>
                </div>

                <Footer />
            </div>
        )
    };

}

export default Main
