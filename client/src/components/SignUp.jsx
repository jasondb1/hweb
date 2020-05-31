import React from 'react'
import httpClient from '../services/httpClient'

const UserList = () => {
  return(<ul>
          <li>User list (del) (chg password)</li>
      </ul>

   // <ul>
            //     {
            //         this.state.data.map((item, key) => {
            //             return <li key={key}>{item.timeM} {item.description}</li>
            //         })
            //     }
            // </ul>

  );

};

//TODO: use httpClient.getAdmin

// sign up form behaves almost identically to log in form. We could create a flexible Form component to use for both actions, but for now we'll separate the two:
class SignUp extends React.Component {
    state = {
        isAdmin: httpClient.getAdmin(),
        fields: {name: '', email: '', admin: false, password: ''}
    };

    onInputChange(evt) {
        this.setState({
            fields: {
                ...this.state.fields,
                [evt.target.name]: evt.target.value
            }
        })
    }

    //new function to get data
    // this.setState({
    //data: resoponseArray.map(item => {description: item.description, timeM: item.timeM})})

    onFormSubmit(evt) {
        evt.preventDefault();
        httpClient.signUp(this.state.fields).then(user => {
            this.setState({fields: {name: '', email: '', admin: false, password: ''}});
            console.log(this.props);
            if (user) {
                //TODO: this might need to be removed
                if ('onSignUpSuccess' in this.props) {
                    this.props.onSignUpSuccess(user);
                }
                this.props.history.push('/dashboard')
            }
        })
    }

    render() {
        const {name, email, admin, password} = this.state.fields;
        return (
            <div className='SignUp'>
                <div className='row'>
                    <div className='column column-33 column-offset-33'>
                        <h1>Admin</h1>
                        <form className='m-4 border rounded-lg shadow border-primary p-4' onChange={this.onInputChange.bind(this)} onSubmit={this.onFormSubmit.bind(this)}>

                            <div className='form-group'>

                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Name</span>
                                    </div>
                                    <input className='form-control' type="text" placeholder="Name" name="name"
                                           value={name}/>
                                </div>
                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Email</span>
                                    </div>
                                    <input className='form-control' type="text" placeholder="Email" name="email"
                                           value={email}/>
                                </div>
                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Password</span>
                                    </div>
                                    <input className='form-control' type="password" placeholder="Password" name="password"
                                           value={password}/>
                                </div>
                                <div className="input-group form-check">
                                    <input type="checkbox" className="form-check-input" id="admin" name='admin' checked={admin}/>
                                        <label className="form-check-label" htmlFor="admin">Administrator</label>
                                </div>
                                <br/>
                                <button className='btn btn-primary'>Sign Up</button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className='row user-list'>
                    <UserList />
                </div>
            </div>
        )
    }
}

export default SignUp
