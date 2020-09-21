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

//TODO: use httpClient.getAdmin or get list of users
//TODO: confirm password

// sign up form behaves almost identically to log in form. We could create a flexible Form component to use for both actions, but for now we'll separate the two:
class SignUp extends React.Component {
    state = {
        isAdmin: httpClient.getAdmin(),
        fields: {username: '', email: '', admin: false, password: '', password1: ''}
    };

    onInputChange(evt) {
        //console.log("new value", evt.target.value);
        const value = evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
        this.setState({
            fields: {
                ...this.state.fields,
                [evt.target.name]: value
            }
        })
    }

    //new function to get data
    // this.setState({
    //data: resoponseArray.map(item => {description: item.description, timeM: item.timeM})})

    onFormSubmit(evt) {
        evt.preventDefault();
        //console.log("submitting user form");
        //console.log(this.state.fi        //console.log("submitting user form");
        //console.log(this.state.fields);elds);
        //check that passwords match, get error message if username is not unique, etc

        httpClient.signUp(this.state.fields).then(response => {
            console.log("received message back");
            console.log(response);
            //this.setState({message: user.message, success: user.success})


            // if (response) {
            //     //TODO: this might need to be removed
            //     if ('onSignUpSuccess' in this.props) {
            //         this.props.onSignUpSuccess(response);
            //     }
            //     this.props.history.push('/dashboard')
            // }


            this.setState({message: response.message, success: response.success})
            //this.setState({fields: {username: '', email: '', admin: false, password: '', password1: ''}});
        
        })
    }

    render() {
        const {username, email, admin, password, password1} = this.state.fields;
        return (
            <div className='SignUp'>
                <div className='row'>
                    <div className='column column-33 column-offset-33'>
                        <h1>Admin</h1>
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
                                        <span className="input-group-text" id="inputGroup-sizing-default">Email</span>
                                    </div>
                                    <input className='form-control' type="text" placeholder="Email" name="email"
                                           defaultValue={email}/>
                                </div>
                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Password</span>
                                    </div>
                                    <input className='form-control' type="password" placeholder="Password" name="password"
                                           defaultValue={password}/>
                                </div>
                               <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Re-Enter Password</span>
                                    </div>
                                    <input className='form-control' type="password" placeholder="Re-Enter Password" name="password1"
                                           defaultValue={password1}/>
                                </div>
                                
                                <div className="input-group form-check">
                                    <input type="checkbox" className="form-check-input" id="admin" name='admin' defaultChecked={admin}/>
                                        <label className="form-check-label" htmlFor="admin">Administrator</label>
                                </div>
                                <br/>
                                <button className='btn btn-primary'>Sign Up</button>   
                                <div className="mt-3">
                                    {this.state.message}
                                </div>
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
