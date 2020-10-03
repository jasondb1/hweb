import React from 'react'
import httpClient from '../services/httpClient'

class LogIn extends React.Component {
    state = {
        fields: {username: '', email: '', password: ''}
    };

    onInputChange(evt) {
        this.setState({
            fields: {
                ...this.state.fields,
                [evt.target.name]: evt.target.value
            }
        });
    };

    onFormSubmit(evt) {
        evt.preventDefault();
        httpClient.logIn(this.state.fields)
            .then(user => {
                this.setState({fields: {username: '', email: '', password: ''}});
                if (user) {
                    this.props.onLoginSuccess(user);
                    this.props.history.push('/main/dashboard')
                }
            })
    };

    render() {
        const {username, email, password} = this.state.fields;
        return (
            <div className='LogIn'>
                <div className='row'>
                    <div className='column column-33 column-offset-33'>
                        <h1>Log In</h1>
                        <form className='m-4 border rounded-lg shadow border-primary p-4' onChange={this.onInputChange.bind(this)} onSubmit={this.onFormSubmit.bind(this)}>

                            <div className='form-group'>
                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Username</span>
                                    </div>
                                    <input className='form-control' type="text" placeholder="username" name="username"
                                           defaultValue={username}/>
                                </div>

                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Password</span>
                                    </div>
                                    <input className='form-control' type="password" placeholder="Password" name="password"
                                           defaultValue={password}/>
                                </div>
                                <button className='btn btn-primary'>Log In</button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        );
    };
}

export default LogIn
