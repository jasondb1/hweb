import React, {Component} from 'react';
import { Route } from 'react-router-dom'

import Header from "../components/Header";
import Navmenu from "../components/Navmenu";
import Garage from "../components/Garage";
import Climate from "../components/Climate";
import Dashboard from "../components/Dashboard";
import Test from "../components/Test";
import Status from "../components/Status";


class Main extends Component {

    constructor(props){
        super(props);
    }

    render() {
        const { match } = this.props;
        console.log(match);
        return (
        <div className='Main'>
            <Header />
            <Navmenu />

            <Route path={`${match.path}/dashboard`} component={Dashboard}/>
            <Route path={`${match.path}/garage`} component={Garage}/>
            <Route path={`${match.path}/climate`} component={Climate}/>
            <Route path={`${match.path}/test`} component={Test}/>

            <Controls/>
            <Status/>
        </div>
    )};

}

export default Main
