import React from 'react'
import httpClient from '../services/httpClient'
//import confirmService from '../services/confirmService'
//const deleteIcon = require('../icons/icons8-minus-50.png');
//const editIcon = require('../icons/icons8-minus-50.png');

// sign up form behaves almost identically to log in form. We could create a flexible Form component to use for both actions, but for now we'll separate the two:
class SignUp extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isAdmin: httpClient.getAdmin(),
            fields: { id: null, username: '', email: '', admin: false, password: '', password1: '' },
            data: [],
            passwordValid: false,
            editMode: false,
            success: false,
        };

        this.removeItem = this.removeItem.bind(this);
        this.editItem = this.editItem.bind(this);
        this.resetForm = this.resetForm.bind(this);
    }

    componentDidMount() {
        //get users table
        httpClient.getAllUsers().then(payload => {
            this.setState({ data: payload });
        });
    }

    onInputChange(evt) {
        //console.log("new value", evt.target.value);
        // if (this.state.fields.password === this.state.fields.password1) {
        //     this.setState({ passwordValid: true });
        // } else {
        //     this.setState({ passwordValid: false });
        // }

        const value = evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
        this.setState({
            fields: {
                ...this.state.fields,
                [evt.target.name]: value
            }
        })
    }

    onFormSubmit(evt) {
        evt.preventDefault();

        if (this.state.fields.password === this.state.fields.password1) {
            this.setState({ message: "Passwords don't match" })

            if (this.state.editMode) {
                httpClient.updateUser(this.state.fields).then(response => {
                    this.setState({ message: response.message, success: response.success })
                    if (response.success === true) this.resetForm();
                    let items = this.state.data;
                    items[this.state.editIndex] = response.user;
                    this.setState({ data: items });
                })
            } else {
                httpClient.newUser(this.state.fields).then(response => {
                    this.setState({ message: response.message, success: response.success });
                    if (response.success === true) this.resetForm();
                    const items = [...this.state.data, response.user];
                    this.setState({ data: items });
                })
            }
        } else {
            this.setState({ passwordValid: false });
        }
    }

    resetForm() {
        this.setState({ success: false, editMode: false, fields: { id: null, username: '', email: '', admin: false, password: '', password1: '' } });
        document.getElementById("user-form").reset();
        this.setState({ passwordValid: true });

    }

    async removeItem({ target: { value } }) {
        //const result = await confirmService.show();
        const answer = window.confirm("Delete item?")
        if (answer) {
            //delete items
            let userid = this.state.data[value].id;

            httpClient.deleteUser(userid).then(response => {
                this.setState({ message: response.message, success: response.success });
                const items = this.state.data.filter((data, index) => index !== parseInt(value));
                this.setState({ data: items });
            })
        }
    }

    editItem({ target: { value } }) {
        this.setState({ editIndex: value, editMode: true, fields: { id: this.state.data[value].id, username: this.state.data[value].username, email: this.state.data[value].email, admin: this.state.data[value].admin } });
    }

    render() {
        const { username, email, admin, password, password1 } = this.state.fields;
        //const isPasswordValid = this.state.passwordValid;
        const editMode = this.state.editMode;
        return (
            <div className='SignUp'>
                <div className='row'>
                    <div className='column column-33 column-offset-33'>
                        <h1>Admin</h1>
                        <form id="user-form" className='m-4 border rounded-lg shadow border-primary p-4' onSubmit={this.onFormSubmit.bind(this)}>

                            <div className='form-group'>

                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Username</span>
                                    </div>
                                    <input className='form-control' type="text" placeholder="username" name="username"
                                        onChange={this.onInputChange.bind(this)} value={username || ''} />
                                </div>
                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Email</span>
                                    </div>
                                    <input className='form-control' type="text" placeholder="Email" name="email"
                                        onChange={this.onInputChange.bind(this)} value={email || ''} />
                                </div>
                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Password</span>
                                    </div>
                                    <input className='form-control' type="password" placeholder="Password" name="password"
                                        onChange={this.onInputChange.bind(this)} value={password || ''} />
                                </div>
                                <div className="input-group mb-3">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text" id="inputGroup-sizing-default">Password</span>
                                    </div>
                                    <input className='form-control' type="password" placeholder="Re-Enter Password" name="password1"
                                        onChange={this.onInputChange.bind(this)} value={password1 || ''} />

                                </div>
                                {/* <div>{isPasswordValid === true ? '' : "Passwords don't match or less than 6 characters"}</div> */}

                                <div className="input-group form-check">
                                    <input type="checkbox" className="form-check-input" id="admin" name='admin' onChange={this.onInputChange.bind(this)} checked={admin} />
                                    <label className="form-check-label" htmlFor="admin">Administrator</label>
                                </div>
                                <br />
                                <button className='btn btn-primary'>{editMode === true ? 'Change' : 'Add User'}</button>
                                {editMode === true ? <button value='cancel' onClick={this.resetForm} className='btn btn-danger'>Cancel</button> : ''}
                                <div className="mt-3">
                                    {this.state.message}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                <div className='row user-list'>
                    {/* <UserList data={this.state.data} /> */}
                    <table className="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Admin</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.data.map((user, index) =>
                                <tr key={index}>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.admin === 1 ? "Yes" : ''}</td>
                                    <td>
                                        <button
                                            className="mb-1 btn btn-success"
                                            value={index}
                                            onClick={this.editItem}
                                        >
                                            Edit
                                    </button>
                                        <button
                                            className="mb-1 btn btn-danger"
                                            value={index}
                                            onClick={this.removeItem}
                                        >
                                            Delete
                                    </button>
                                    </td>
                                    <td>


                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}

export default SignUp
