const db = require('../models/Sequelize.js');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
};

async function getAll() {
    return await db.Farm.findAll();
}

async function getById(id) {
    return await getFarm(id);
}

async function create(params) {

    // validatation
    //     if not valid
    //     throw 'Error Message';

    //add entry
    let newItem = await db.Farm.create(
        {
            FarmName: params.FarmName,
            Location: params.Location,
        }
    )
        .then(payload => {
            return payload
        })
        .catch((err) => {
            console.log(">> Error while creating entry: ", err);
        });

    //get the new item
    let farm = await getFarm(newItem.id);
    //console.log(farm);

    return farm;
}

async function update(id, params) {

    // validate

    //update entry
    await db.Farm.update(
        params,
        { where: { id: id} }
    )
        .then(payload => {
            return payload
        })
        .catch((err) => {
            console.log(">> Error while creating entry: ", err);
        });

    let farm = await getFarm(id);

    return farm;
}

async function _delete(id) {
    await db.Farm.destroy({
        where: {
            id: id
        }
    });
}

// helper functions

async function getFarm(id) {
    const entry = await db.Farm.findByPk(id);
    if (!entry) throw 'Entry not found';
    return entry;
}
