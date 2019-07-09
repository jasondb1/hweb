import React, {Component} from 'react';
//import api from "../services/componentService";
//import {componentOn, componentOff, getAuthSocket, socket} from "../services/socket";
import {getAuthSocket} from "../services/socket";
//
// const SOCKET_SERVER = 'http://192.168.1.108:3001';
// const io = require('socket.io-client/socket.io');

class OnOff extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: props.label,
            isOn: props.isOn,
            component: props.component,
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        //getComponentState(this.state.component);
        //console.log('ON OFF updateStatus:');
        this.socket = getAuthSocket();

        // this.socket = openSocket(SOCKET_SERVER);
        // this.socket.on('connect', () => {
        //     //console.log('authenticate');
        //     let token = localStorage.getItem('token');
        //     //console.log( localStorage.getItem('token') );
        //     socket.emit('authenticate', {token: token})
        //         .on('authenticated', () => {
        //             console.log('socket authenticated')
        //         })
        //         .on('unauthorized', function(error, callback) {
        //             if (error.data.type === "UnauthorizedError" || error.data.code === "invalid_token") {
        //                 // redirect user to login page perhaps or execute callback:
        //                 callback();
        //                 console.log("User's token has expired");
        //             }
        //         });
        //
        //
        //
        // });

        this.socket.on('componentStatusUpdate', (data) => {
            console.log('got update for component');
            if (data.component === this.state.component) {
                this.setState({isOn: data.isOn});
            }
        });
        this.socket.emit('componentGetStatus', this.state.component);

            //api.getComponentState(this.state.component).then(json => this.setState({isOn: json.isOn}));
    }

    handleClick() {
        if (this.state.isOn) {
            console.log('handle click: comp off');
            //api.componentOff(this.state.component).then(json => this.setState({isOn: false}));
            //componentOff(this.state.component);
            this.socket.emit('turnComponentOff', this.state.component);
        } else {
            console.log('handle click: comp on');
            //api.componentOn(this.state.component).then(json => this.setState({isOn: true}));
            //componentOn(this.state.component);
            this.socket.emit('turnComponentOn', this.state.component);
        }
    };

    btnClasses() {
        let classes = "m-2 btn";
        classes += this.state.isOn === true ? ' btn-success' : ' btn-danger';
        return classes;
    }

    render() {
        return (
            <div className='control'>
                <label>
                    {this.state.label}
                </label>
                <button
                    onClick={this.handleClick}
                    className={this.btnClasses()}
                >
                    {this.state.isOn ? 'ON' : 'OFF'}
                </button>
            </div>
        );
    }
}

export default OnOff;
