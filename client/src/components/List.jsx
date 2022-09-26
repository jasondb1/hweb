import React from 'react';

//props.columns, props.columns, props.canDelete, props.canEdit
//editFunction deleteFunction

const List = (props) => {

    return (
        <table className="table table-striped table-bordered">
            <thead>
                <tr>
                    {props.columns.map((item, index) =>
                        <th key={index}>{item.columnName}</th>
                    )}

                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {props.data.map((item, index) =>
                    <tr key={index}>

                        {props.columns.map((column, i) =>
                            <td key={i}>{item[column.name]}</td>
                        )}

                        <td>
                            {props.canEdit &&
                                <button
                                    className="mb-1 btn btn-sm btn-outline-success"
                                    value={index}
                                    onClick={props.editFunction}
                                >
                                    Edit
                                    </button>
                            }
                            {props.canDelete &&
                                <button
                                    className="mb-1 btn btn-sm btn-outline-danger"
                                    value={index}
                                    onClick={props.deleteFunction}
                                >
                                    Delete
                                    </button>
                            }
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    )
};

export default List