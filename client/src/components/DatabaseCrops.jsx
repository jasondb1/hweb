import React from 'react';
import { Link } from 'react-router-dom';
import "./Form.css";

import httpDbService from '../services/databaseService';
import Form from './Form';
import List from './List';

const restUrl = '/api/database/crop/';

const homeicon = require('../icons/icons8-home-50.png');
//import confirmService from '../services/confirmService'
//const deleteIcon = require('../icons/icons8-minus-50.png');
//const editIcon = require('../icons/icons8-minus-50.png');

let tableColumns = [
    //{ name: 'id', columnName: '', isDisplayed: false, type: 'hidden' },
    { name: 'CropName', columnName: 'Name', isDisplayed: true, type: 'text' },
    { name: 'Variety', columnName: 'Variety', isDisplayed: true, type: 'text' },
    { name: 'DaysToMaturity', columnName: 'DTM', isDisplayed: true, type: 'text' },
    { name: 'Transplant', columnName: 'Transplant', isDisplayed: true, type: 'text' },
    { name: 'DirectSeed', columnName: 'Direct Seed', isDisplayed: true, type: 'text' },
    { name: 'MinDaysToGerminate', columnName: 'Min DTG', isDisplayed: true, type: 'text' },
    { name: 'MaxDaysToGerminate', columnName: 'Max DTG', isDisplayed: true, type: 'text' },
    { name: 'SeedsPer100Row', columnName: 'Seeds/100ft', isDisplayed: true, type: 'text' },
    { name: 'SeedsPerAcre', columnName: 'Seeds/Acre', isDisplayed: true, type: 'text' },
    { name: 'HarvestPer100Row', columnName: 'Yield/100ft', isDisplayed: true, type: 'text' },
    { name: 'Units', columnName: 'Units', isDisplayed: true, type: 'text' },
    { name: 'SeedDepth', columnName: 'Seed Depth', isDisplayed: true, type: 'text' },
    { name: 'PlantSpacing', columnName: 'Plant Spacing', isDisplayed: true, type: 'text' },
    { name: 'RowSpacing', columnName: 'Row Spacing', isDisplayed: true, type: 'text' },
    { name: 'MinSoilTemperature', columnName: 'Min Soil Temp', isDisplayed: true, type: 'text' },
    { name: 'MaxSoilTemperature', columnName: 'Max Soil Temp', isDisplayed: true, type: 'text' },
    { name: 'MinIdealPh', columnName: 'Min ph', isDisplayed: true, type: 'text' },
    { name: 'MaxIdealPh', columnName: 'Max ph', isDisplayed: true, type: 'text' },
    { name: 'OptimalSunLight', columnName: 'Optimal Daily Sunlight', isDisplayed: true, type: 'text' },
    { name: 'OptimalStorageTemp', columnName: 'Optimal Storage Temp', isDisplayed: true, type: 'text' },
    { name: 'OptimalLightPerDay', columnName: 'Optimal Light/Day', isDisplayed: true, type: 'text' },
    { name: 'EstimatedValuePerUnit', columnName: 'Value/Unit', isDisplayed: true, type: 'text' },
    { name: 'Notes', columnName: 'Notes', isDisplayed: true, type: 'multiline' },
];

let formFields = [
    { name: 'id', value: null, fieldName: 'id', type: 'hidden' },
    { name: 'CropName', value: '', fieldName: 'Crop Name', type: 'text' },
    { name: 'Variety', value: '', fieldName: 'Variety', type: 'text' },
    { name: 'DaysToMaturity', value: '', fieldName: 'DTM', type: 'text' },
    { name: 'Transplant', value: '', fieldName: 'Transplant', type: 'toggle' },
    { name: 'DirectSeed', value: '', fieldName: 'Direct Seed', type: 'toggle' },
    { name: 'MinDaysToGerminate', value: '', fieldName: 'Min DTG', type: 'text' },
    { name: 'MaxDaysToGerminate', value: '', fieldName: 'Max DTG', type: 'text' },
    { name: 'SeedsPer100Row', value: '', fieldName: 'Seeds/100ft', type: 'text' },
    { name: 'SeedsPerAcre', value: '', fieldName: 'Seeds/Acre', type: 'text' },
    { name: 'HarvestPer100Row', value: '', fieldName: 'Yield/100ft', type: 'text' },
    { name: 'Units', value: '', fieldName: 'Units', type: 'text' },
    { name: 'SeedDepth', value: '', fieldName: 'Seed Depth', type: 'text' },
    { name: 'PlantSpacing', value: '', fieldName: 'Plant Spacing', type: 'text' },
    { name: 'RowSpacing', value: '', fieldName: 'Row Spacing', type: 'text' },
    { name: 'MinSoilTemperature', value: '', fieldName: 'Min Soil Temp', type: 'text' },
    { name: 'MaxSoilTemperature', value: '', fieldName: 'Max Soil Temp', type: 'text' },
    { name: 'MinIdealPh', value: '', fieldName: 'Min Ideal ph', type: 'text' },
    { name: 'MaxIdealPh', value: '', fieldName: 'Max Ideal ph', type: 'text' },
    { name: 'OptimalSunlight', value: '', fieldName: 'Optimal Sun Light', type: 'text' },
    { name: 'OptimalStorageTemp', value: '', fieldName: 'Optimal Storage Temp', type: 'text' },
    { name: 'OptimalLightPerDay', value: '', fieldName: 'Optimal Light/Day', type: 'text' },
    { name: 'EstimatedValuePerUnit', value: '', fieldName: 'Value/Unit', type: 'text' },
    { name: 'Notes', value: '', fieldName: 'Notes', type: 'text' },
];

//TODO: get username maybe

class Crops extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            fields: formFields,
            tableData: [{}],
            editMode: false,
            success: false,
        };

        this.removeItem = this.removeItem.bind(this);
        this.editItem = this.editItem.bind(this);
        this.resetForm = this.resetForm.bind(this);
    }

    componentDidMount() {
        httpDbService.getAllRecords(restUrl).then(payload => {
            this.setState({ tableData: payload });
        });
    }

    onInputChange(evt) {
        const value = evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;

        formFields[evt.target.id].value = value;
        this.setState({ fields: formFields });
    }

    onFormSubmit(evt) {
        evt.preventDefault();

        if (this.state.editMode) {
            //console.log("submitted in edit mode")
            httpDbService.updateRecord(restUrl, this.state.fields).then(response => {
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
            httpDbService.newRecord(restUrl, this.state.fields).then(response => {
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

            httpDbService.deleteRecord(restUrl, id).then(response => {
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
            <div>
                <Link className='nav-link' to="/database/" ><img alt="" className="icon" src={homeicon} height='32' />Back</Link>

                <div className='Form'>
                    <div className='row'>
                        <div className='column column-33 column-offset-33'>
                            <h1>Crop Setup</h1>
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
            </div>
        )
    }
}

export default Crops
