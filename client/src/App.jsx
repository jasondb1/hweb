import React from 'react'
import {Switch, Route, Redirect} from 'react-router-dom'
import httpClient from './services/httpClient'

//import NavBar from './NavBar'
import LogIn from './views/LogIn'
import LogOut from './views/LogOut'
import SignUp from './components/SignUp'
//import Home from './views/Home'
//import Dashboard from './views/Dashboard';
import Main from './views/Main';

class App extends React.Component {
    state = {currentUser: httpClient.getCurrentUser(),
        isAdmin: httpClient.getAdmin(),
    };

    onLoginSuccess(user) {
        this.setState({currentUser: httpClient.getCurrentUser(), isAdmin: httpClient.getAdmin()});
    }

    onSignUpSuccess(user) {
        //this.setState({currentUser: httpClient.getCurrentUser()});
    }

    logOut() {
        httpClient.logOut();
        this.setState({currentUser: null, isAdmin: null});
    }

    render() {
        const {currentUser} = this.state;
        const {isAdmin} = this.state;
        return (
            <div className='App container-fluid'>

                { /*<NavBar currentUser={currentUser}/> */}

                <Switch>

                    <Route path="/login" render={(props) => {
                        return <LogIn {...props} onLoginSuccess={this.onLoginSuccess.bind(this)}/>
                    }}/>

                    <Route path="/logout" render={(props) => {
                        return <LogOut onLogOut={this.logOut.bind(this)}/>
                    }}/>

        {/* TODO: only allow for time when no admin is present; the sign up component takes an 'onSignUpSuccess' prop which will perform the same thing as onLoginSuccess: set the state to contain the currentUser */}
                    <Route path="/signup" render={(props) => {
                        return <SignUp {...props} onSignUpSuccess={this.onLoginSuccess.bind(this)}/>
                    }}/>

                    {/* } <Route path="/dashboard" render={() => {
                        return currentUser
                            ? <Dashboard/>
                            : <Redirect to="/login"/>
                    }}/> 
                    Note: This is a testing dashboard can likely delete*/}

                    <Route path="/main" render={(props) => {
                        return currentUser
                            ? <Main {...props} currentUser={currentUser} isAdmin={isAdmin} />
                            : <Redirect to="/login"/>
                    }}/>

                    <Route path="/" render={(props) => {
                        return currentUser
                            ? <Main {...props} currentUser={currentUser} isAdmin={isAdmin}/>
                            : <Redirect to="/login"/>
                    }}/>

                </Switch>
            </div>
        )
    }
}

export default App
