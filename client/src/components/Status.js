import React, {Component} from 'react';
import api from "../services/componentService";

const UPDATEINTERVAL = 10000;

const ListItems = (props) => {
    console.log(props.values);
    //console.log(props.values.length());
    //if (props.values.length > 0){
    //	props.values.map( (value) => {
    //		return (<ListItem key={value} value={value} />);
    //	});
    //} else {
    //	console.log("return null");
    //	return null;
    //}

    return (
        <ul>
            <li key="temp_local">Temperature Local: {props.values.temp_local}</li>
            <li key="humidity_local">Humidity Local: {props.values.humidity_local}</li>
            <li key="temp_remote0">Temperature Remote: {props.values.temp_remote0}</li>
            <li key="humidity_remote0">Humidity Remote: {props.values.humidity_remote0}</li>
            <li key="presistor_remote0">Light Remote: {props.values.presistor_remote0}</li>
        </ul>
    )
};

class Status extends Component {
    constructor() {
        super();
        this.state = {
            status: [],
        };
        this.updateStatus = this.updateStatus.bind(this);
    }

    componentDidMount() {
        this.interval = setInterval(this.updateStatus, UPDATEINTERVAL);
    };


    componentWillUnmount() {
        clearInterval(this.interval);
    }

    updateStatus() {
        //console.log("updating status");
        api.getStatus().then(json => this.setState({status: json}));
    }

    render() {
        return (
            <div>
                <h2>Status</h2>
                <ListItems values={this.state.status}/>
            </div>
        );
    }

}

export default Status;
