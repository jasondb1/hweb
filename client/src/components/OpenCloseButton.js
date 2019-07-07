import React, {Component} from 'react';
//import api from "../services/componentService";
import { componentOpen, componentClose, socket } from "../services/socket";


class OpenClose extends Component {

    constructor(props) {
        super(props);

        this.state = {
            label: props.label,
            isOpen: props.isOpen,
            component: props.component,
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {

        socket.on('componentStatusUpdate', (data) => {
            if (data.component === this.state.component) {
                this.setState({isOpen: data.isOpen});
                console.log('updateStatus:');
                console.log(data);
            }

        });
        //api.getComponentState(this.state.component).then(json => this.setState({isOpen: json.isOpen}));
    }

    handleClick() {
        if (this.state.isOpen) {
            componentOpen(this.state.component);
            //api.componentOpen(this.state.component).then(json => this.setState({isOpen: false}));
        } else {
            componentClose(this.state.component);
            //api.componentClose(this.state.component).then(json => this.setState({isOpen: true}));
        }
    };

    btnClasses() {
        let classes = "m-2 btn";
        classes += this.state.isOpen === true ? ' btn-success' : ' btn-danger';
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
                    {this.state.isOpen ? 'OPEN' : 'CLOSE'}
                </button>
            </div>
        );
    }
}

export default OpenClose;
