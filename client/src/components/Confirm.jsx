import React, { Component } from 'react';
import { render } from 'react-dom';

let resolve;
const defaultProps = {
  title: 'Confirmation',
  message: 'Are you sure?'
};

class Confirm extends Component {

     static create(props = {}) {
    const containerElement = document.createElement('div');
    document.body.appendChild(containerElement);
    return render(<Confirm createConfirmProps={props} />, containerElement);
  }

 constructor() {
   super();

   this.state = {
     isOpen: false,
     showConfirmProps: {},
   };

    this.handleCancel = this.handleCancel.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.show = this.show.bind(this);
 }


  handleCancel() {
    this.setState({isOpen: false});
    resolve(false);
  }

  handleConfirm() {
    this.setState({isOpen: false});
    resolve(true);
  }

  show(props = {}) {
      console.log("show confirm dialog");
    const showConfirmProps = { ...this.props.createConfirmProps, ...props };
    this.setState({ isOpen: true, showConfirmProps });
    return new Promise((res) => {
      resolve = res;
    });
  }

 render() {
    const { isOpen, showConfirmProps } = this.state;
    const { message, title, ...rest } = showConfirmProps;
    return (
      <div className={!isOpen ? 'modal' : 'modal is-active'}>
        <div className="modal-background" />
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">{title || defaultProps.title}</p>
            <button className="delete" aria-label="close" onClick={this.handleCancel} />
          </header>
          <section className="modal-card-body">
            <p>{message || defaultProps.message}</p>
          </section>
          <footer className="modal-card-foot">
            <button className="button is-danger" onClick={this.handleConfirm}>OK</button>
            <button className="button" onClick={this.handleCancel}>Cancel</button>
          </footer>
        </div>
      </div>
    );
  }
}

export default Confirm;