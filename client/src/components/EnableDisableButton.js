import React, {Component} from 'react';
import {getAuthSocket} from "../services/socket";

class EnableDisableButton extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: props.label,
            isEnabled: props.isEnabled,
            component: props.component,
        };
    }

    componentDidMount() {
        this.socket = getAuthSocket();

        this.socket.on('statusUpdate', (data) => {
         this.setState({isEnabled: data[this.component].value})
        });
        //this.socket.emit('componentGetStatus', this.state.component);

            //api.getComponentState(this.state.component).then(json => this.setState({isOn: json.isOn}));
    }

    handleClick() {
            this.socket.emit(this.props.eventString, !this.state.isEnabled);
    };

    btnClasses() {
        let classes = "m-2 btn";
        classes += this.state.isEnabled === true ? ' btn-success' : ' btn-danger';
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
                    {this.state.isEnabled ? 'Enabled' : 'Disabled'}
                </button>
            </div>
        );
    }
}

export default EnableDisableButton;
