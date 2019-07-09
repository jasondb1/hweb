import React, {Component} from 'react';
import {socket} from "../services/socket";
//import api from "../services/componentService";
//import { componentOn, componentOff, socket } from "../services/socket";


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
        console.log('ON OFF updateStatus:');
        console.log(this.props.socket);
        this.sock = this.props.socket;

        this.sock.on('componentStatusUpdate', (data) => {
            console.log('updateStatus:');
            if (data.component === this.state.component) {
                this.setState({isOn: data.isOn});

                console.log(data);
            }

        });


            //api.getComponentState(this.state.component).then(json => this.setState({isOn: json.isOn}));
    }

    handleClick() {
        if (this.state.isOn) {
            //api.componentOff(this.state.component).then(json => this.setState({isOn: false}));
            //componentOff(this.state.component);
            this.sock.emit('componentOff', this.state.component);
        } else {
            //api.componentOn(this.state.component).then(json => this.setState({isOn: true}));
            //componentOn(this.state.component);
            this.sock.emit('componentOn', this.state.component);
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
