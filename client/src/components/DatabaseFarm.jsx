import React from 'react';
import httpClient from '../services/databaseService';
import Form from './Form';
import List from './List';
//import confirmService from '../services/confirmService'
//const deleteIcon = require('../icons/icons8-minus-50.png');
//const editIcon = require('../icons/icons8-minus-50.png');

let formFields = [
    { name: 'id', value: null, fieldName: '', type: 'hidden' },
    // { name: 'username', value: null, fieldName: 'Username', type: 'text' },
    { name: 'FarmName', value: '', fieldName: 'Farm Name', type: 'text' },
    { name: 'Location', value: '', fieldName: 'Location', type: 'text' }
];

let tableColumns = [
    //{ name: 'id', columnName: '', isDisplayed: false, type: 'hidden' },
    { name: 'FarmName', columnName: 'Farm Name', isDisplayed: true, type: 'text' },
    { name: 'Location', columnName: 'Location', isDisplayed: true, type: 'text' }
];

//TODO: get username maybe

class Farm extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            fields: formFields,
            tableData: [{}],
            editMode: false,
            success: false,
        };

        this.formFields = formFields;

        this.removeItem = this.removeItem.bind(this);
        this.editItem = this.editItem.bind(this);
        this.resetForm = this.resetForm.bind(this);
    }

    componentDidMount() {
        //get table data
        httpClient.getAllRecords('/api/database/farm/').then(payload => {
            this.setState({ tableData: payload });
        });
    }

    onInputChange(evt) {
        const value = evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
        this.formFields[evt.target.id].value = value;
        this.setState({
            fields: this.formFields
        })
    }

    onFormSubmit(evt) {
        evt.preventDefault();

        if (this.state.editMode) {
            //console.log("submitted in edit mode")
            httpClient.updateRecord('/api/database/farm/', this.state.fields).then(response => {
                //console.log(response);
                if (response.success === true) {
                    this.resetForm();
                    let items = this.state.tableData;
                    //console.log(data);
                    items[this.state.editIndex] = response.payload;
                    this.setState({ tableData: items, message: response.message, success: response.success });
                } else {
                    this.setState({ message: response.message, success: response.success });
                }
            })
        } else {
            //console.log("submitted in non edit mode")
            httpClient.newRecord('/api/database/farm/', this.state.fields).then(response => {
                if (response.success === true) {
                    this.resetForm();
                    const items = [...this.state.tableData, response.payload];
                    this.setState({ tableData: items, message: response.message, success: response.success });
                } else {
                    this.setState({ message: response.message, success: response.success });
                }
            })
        }
    }

    async removeItem({ target: { value } }) {
        //const result = await confirmService.show();
        const answer = window.confirm("Delete item?")
        if (answer) {
            //delete items
            let id = this.state.tableData[value].id;

            httpClient.deleteRecord('/api/database/farm/', id).then(response => {
                this.setState({ message: response.message, success: response.success });
                const items = this.state.tableData.filter((data, index) => index !== parseInt(value));
                this.setState({ tableData: items });
            })
        }
    }

    resetForm() {

        for (let element of this.formFields) {
            element.value = null;
        }

        this.setState({
            success: false,
            editMode: false,
            fields: this.formFields,
        });
        document.getElementById("user-form").reset();
    }

    editItem({ target: { value } }) {

        for (let element of this.formFields) {
            element.value = this.state.tableData[value][element.name];
        }

        this.setState({
            editIndex: value,
            editMode: true,
            fields: this.formFields,
        });
    }

    render() {
        return (
            <div className='Form'>
                <div className='row'>
                    <div className='column column-33 column-offset-33'>
                        <h1>Farm Setup</h1>
                        <Form fields={this.state.fields}
                            changeFunction={this.onInputChange.bind(this)}
                            submitFunction={this.onFormSubmit.bind(this)}
                            resetFunction={this.resetForm}
                            editMode={this.state.editMode}
                        />
                        <span className={this.state.success === true ? 'text-success' : 'text-danger'} >{this.state.message}</span>
                    </div>
                </div>
                <div className='row user-list'>
                    <List data={this.state.tableData}
                        columns={tableColumns}
                        canDelete={true}
                        canEdit={true}
                        editFunction={this.editItem}
                        deleteFunction={this.removeItem}
                    />
                </div>
            </div >
        )
    }
}

export default Farm
