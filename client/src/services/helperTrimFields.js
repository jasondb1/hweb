//field to object
function trimFields (fieldData) {

    let newObject = {};
    for(let item of fieldData){
        newObject[item.name] = item.value;
    }

    return newObject;
}

export default trimFields