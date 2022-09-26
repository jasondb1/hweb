import React, {Component} from 'react';
import {authSocket} from "../services/socket";

class OffAutoButton extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: props.label,
            isOn: props.isOn,
            component: props.component,
        };
    }

    componentDidMount() {
        //this.socket = getAuthSocket();
        this.socket = authSocket();

        this.socket.on('statusUpdate', (data) => {
        //console.log(data);
        //console.log(this.state);
         this.setState({isOn: data[this.state.component]})
        });
        //console.log(this.state);
        //this.socket.emit('componentGetStatus', this.state.component);

            //api.getComponentState(this.state.component).then(json => this.setState({isOn: json.isOn}));
    }

    componentWillUnmount() {
        this.socket.close();
    }

    handleClick() {
            this.socket.emit(this.props.eventString, !this.state.isOn);
    };

    btnClasses() {
        let classes = "m-2 btn";
        classes += this.state.isOn === true ? ' btn-alert' : ' btn-success';
        return classes;
    }

    render() {
        return (
            <div className='control'>
                <label>
                    {this.state.label}
                </label>
                <button
                    onClick={this.handleClick.bind(this)}
                    className={this.btnClasses()}
                >
                    {this.state.isOn ? 'On' : 'Auto'}
                </button>
            </div>
        );
    }
}

export default OffAutoButton;
