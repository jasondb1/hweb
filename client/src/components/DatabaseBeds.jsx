import React from 'react';
import { Link } from 'react-router-dom';
import "./Form.css";
import httpDbService from '../services/databaseService';
import Form from './Form';
import List from './List';

const restUrl = '/api/database/bed/';

const homeicon = require('../icons/icons8-home-50.png');
//import confirmService from '../services/confirmService'
//const deleteIcon = require('../icons/icons8-minus-50.png');
//const editIcon = require('../icons/icons8-minus-50.png');
const BEDTYPES = [{ id: "Soil", name: "Soil" }, { id: "Raised", name: "Raised" }, { id: "Nursery", name: "Nursery" }, { id: "Container", name: "Container" }, { id: "Kratky", name: "Kratky" },
{ id: "NFT", name: "NFT" }, { id: "DWC", name: "DWC" }, { id: "Flood & Drain", name: "Flood & Drain" }];
const LIGHTTYPES = [{ id: "Sun/Natural", name: "Sun/Natural" }, { id: "Greenhouse Natural", name: "Greenhouse Natural" }, { id: "Fluorescent", name: "Fluorescent" }, { id: "LED", name: "LED" }];
const STATUSLIST = [{ id: "Empty", name: "Empty" }, { id: "Normal", name: "Normal" }, { id: "Planned", name: "Planned" }, { id: "Needs Attention", name: "Needs Attention" }];

let tableColumns = [
    //{ name: 'id', columnName: '', isDisplayed: false, type: 'hidden' },
    { name: 'Description', columnName: 'Description', isDisplayed: true, type: 'text' },
    { name: 'Location', columnName: 'Location', isDisplayed: true, type: 'text' },
    { name: 'Planted', columnName: 'planted', isDisplayed: true, type: 'text' },
    { name: 'Status', columnName: 'Status', isDisplayed: true, type: 'text' },
    { name: 'Tags', columnName: 'Tags', isDisplayed: true, type: 'text' },
    { name: 'Length', columnName: 'Length', isDisplayed: true, type: 'text' },
    { name: 'Width', columnName: 'Width', isDisplayed: true, type: 'text' },
    { name: 'Type', columnName: 'Type', isDisplayed: true, type: 'text' },
    { name: 'ReservoirVolume', columnName: 'Res. Volume', displayIf: "Tags === Hydroponic", isDisplayed: true, type: 'text' },
    { name: 'farmId', columnName: 'Farm', isDisplayed: true, type: 'text' },
    { name: 'greenhouseId', columnName: 'Greenhouse', isDisplayed: true, type: 'text' },
    //{ name: 'nurseryId', columnName: 'Nursery', isDisplayed: true, type: 'text' },
    { name: 'plantedcropId', columnName: 'Crop', isDisplayed: true, type: 'text' },
];

let formFields = [
    { name: 'id', value: null, fieldName: '', type: 'hidden' },
    { name: 'Active', value: null, fieldName: 'Active', type: 'toggle' },
    { name: 'Description', value: '', fieldName: 'Description', type: 'text' },
    { name: 'Status', value: '', fieldName: 'Status', type: 'select', options: STATUSLIST },
    { name: 'Planted', value: null, fieldName: 'Planted', type: 'toggle' },
    { name: 'Tags', value: '', fieldName: 'Tags', type: 'text' },
    { name: 'Location', value: '', fieldName: 'Location', type: 'text' },
    { name: 'Length', value: '', fieldName: 'Length (m)', type: 'text' },
    { name: 'Width', value: '', fieldName: 'Width (m)', type: 'text' },
    { name: 'Type', value: '', fieldName: 'Type', type: 'select', options: BEDTYPES },
    { name: 'ReservoirVolume', value: '', fieldName: 'Reservoir Vol(L)', type: 'text' },
    { name: 'LightType', value: '', fieldName: 'Light Type', type: 'select', options: LIGHTTYPES },
    { name: 'farmId', value: '', fieldName: 'Farm', type: 'select', options: [] },
    { name: 'plantedcropId', value: '', fieldName: 'Planted Crop', type: 'select', options: [] },
    //{ name: 'nurseryId', value: '', fieldName: 'Nursery', type: 'select', options: [] },
    { name: 'greenhouseId', value: '', fieldName: 'Greenhouse', type: 'select', options: [] },
];

class Beds extends React.Component {

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
        //get table data
        httpDbService.getAllRecords('/api/database/farm/').then(payload => {
            let index = formFields.findIndex(element => element.name === 'farmId');
            formFields[index].options = payload.map(obj => { obj.name = obj.FarmName; delete (obj.FarmName); return obj });
            this.setState({ fields: formFields });
        });

        // //get crops
        // httpDbService.getAllRecords(restUrl).then(payload => {
        //     let index = formFields.findIndex(element => element.name === 'plantedcropId');
        //     formFields[index].options = payload.map(obj => { obj.name = obj.CropName; delete (obj.CropName); return obj });
        //     this.setState({ fields: formFields });
        // });

        // //get greenhouse
        // httpDbService.getAllRecords(restUrl).then(payload => {
        //     let index = formFields.findIndex(element => element.name === 'greenhouseId');
        //     formFields[index].options = payload.map(obj => { obj.name = obj.Description; delete (obj.Description); return obj });
        //     this.setState({ fields: formFields });
        // });

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
                            <h1>Bed Setup</h1>
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

export default Beds
