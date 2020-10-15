import React from 'react';
//import Select from 'react-select';

const Form = (props) => {
    //console.log(props);

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
                        {element.type === 'select' && <select id={index} name={element.name} onChange={props.changeFunction} value={element.value} >
                            {element.options.map((item, index) => <option key={index} value={item.id}>{item.name}</option>)}
                        </select>}
                        {element.type === 'text' && <input id={index} className='form-control' type="text" placeholder={element.fieldName} name={element.name}
                            onChange={props.changeFunction} value={element.value || ''} />
                        }
                        {element.type === 'toggle' &&
                            <label className="ml-3 switch">
                                <input id={index} name={element.name} onChange={props.changeFunction} value={element.value || ''} type="checkbox" checked={element.value} />
                                <span className="slider round"></span>
                            </label>
                        }

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