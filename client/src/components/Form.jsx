import React from 'react';

const Form = (props) => {

    return (
        <form id="user-form" className='m-4 border rounded-lg shadow border-primary p-4' onSubmit={props.submitFunction} >
            <div className='form-group'>

                {props.fields.map((element, index) =>

                    <div key={index} className="input-group mb-3">
                        {element.type !== 'hidden' &&
                            <div className="input-group-prepend">
                                <span className="input-group-text" id="inputGroup-sizing-default">{element.fieldName}</span>
                            </div>
                        }
                        <input id={index} className='form-control' type={element.type} placeholder={element.fieldName} name={element.name}
                            onChange={props.changeFunction} value={element.value || ''} />
                    </div>
                )}

                <br />
                <button className='btn btn-outline-primary'>{props.editMode === true ? 'Change' : 'Add'}</button>
                {props.editMode === true ? <button value='cancel' onClick={props.resetFunction} className='btn btn-outline-danger'>Cancel</button> : ''}
            </div>
        </form>
    )
};

export default Form