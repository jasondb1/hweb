import React, {Component} from 'react';
import api from "../services/componentService";


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
        api.getComponentState(this.state.component).then(json => this.setState({isOn: json.isOn}));
    }

    handleClick() {
        if (this.state.isOn) {
            api.componentOff(this.state.component).then(json => this.setState({isOn: false}));
        } else {
            api.componentOn(this.state.component).then(json => this.setState({isOn: true}));
        }
    };

    btnClasses() {
        let classes = "btn";
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
