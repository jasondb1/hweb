import React from 'react'
import httpClient from '../services/httpClient'
//import { authenticate } from '../services/socket';

class LogIn extends React.Component {
    state = {
        fields: {email: '', password: ''}
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
        // .then(user => {
        //     console.log('Dashboard - Authenticate socket');
        //     authenticate();
        //     return user;
        // })

            .then(user => {
            this.setState({fields: {email: '', password: ''}});
            if (user) {
                this.props.onLoginSuccess(user);
                this.props.history.push('/dashboard')
            }
        })
    };

    render() {
        const {email, password} = this.state.fields;
        return (
            <div className='LogIn'>
                <div className='row'>
                    <div className='column column-33 column-offset-33'>
                        <h1>Log In</h1>
                        <form onChange={this.onInputChange.bind(this)} onSubmit={this.onFormSubmit.bind(this)}>
                            <input type="text" placeholder="Email" name="email" value={email}/>
                            <input placeholder="Password" name="password" value={password}/>
                            <button>Log In</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };
}

export default LogIn
