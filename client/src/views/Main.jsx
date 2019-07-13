import React, {Component} from 'react';
import { Route } from 'react-router-dom'

import Header from "../components/Header";
import Navmenu from "../components/Navmenu";
import Garage from "../components/Garage";
import Climate from "../components/Climate";
import Dashboard from "../components/Dashboard";
import Test from "../components/Test";;


class Main extends Component {

     constructor(props){
         super(props);
    
        console.log(props);
    }

    render() {
        const { match } = this.props;
        const {currentUser} = this.props;
        console.log(currentUser);
        return (
        <div className='Main'>
            <Header currentUser={currentUser} />
            <Navmenu currentUser={currentUser} />
            <Route path={`${match.path}/`} component={Dashboard} exact/>
            <Route path={`${match.path}/dashboard`} component={Dashboard}/>
            <Route path={`${match.path}/garage`} component={Garage}/>
            <Route path={`${match.path}/climate`} component={Climate}/>
            <Route path={`${match.path}/test`} component={Test}/>
        </div>
    )};

}

export default Main
