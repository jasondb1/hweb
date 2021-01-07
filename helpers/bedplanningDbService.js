const express = require('express');
const db = require('../models/Sequelize.js');
const dbAction = db.Bedplanning;
const item = "Bed Planning";
const selectionAttributes = { attributes: ['id'] };

module.exports = {
    create,
    getAll,
    getNames,
    getById,
    update,
    _delete,
};

async function create(req, res, next) {

    await dbAction.create(
        req.body
    )
        .then(payload => {
            //return payload;
            getRecord(payload.id)
                .then(data => res.json({ payload: data, message: ('New ' + item + ' Added'), success: true }))
                .catch(err => {
                    res.json({ message: ('Error Creating ' + item), success: false })
                });
            return payload;
        })
        .catch((err) => {
            console.log(">> Error while creating entry: ", err);
        });
}

async function getAll(req, res, next) {

    await dbAction.findAll()
        .then(payload => res.json(payload))
        .catch(err => {
            res.json({ message: ('Error Finding ' + item), success: false })
        });
}

async function getNames(req, res, next) {

    await dbAction.findAll(selectionAttributes)
        .then(payload => res.json(payload))
        .catch(err => {
            res.json({ message: ('Error Retrieving ' + item + ' Names'), success: false })
        });
}

async function getById(req, res, next) {

    await dbAction.findByPk(req.params.id)
        .then(payload => res.json(payload))
        .catch(err => {
            res.json({ message: ('Error Retrieving ' + item), success: false })
        });
}

async function update(req, res, next) {

    //update entry
    await dbAction.update(
        req.body,
        { where: { id: req.params.id } }
    )
        .then(payload => {
            //return payload;
            getRecord(req.params.id)
                .then(data => res.json({ payload: data, message: (item +' Updated'), success: true }))
                .catch(err => {
                    res.json({ message: ('Error Updating ' + item), success: false })
                });
            return payload;
        })
        .catch((err) => {
            console.log(">> Error while creating entry: ", err);
        });
}

async function _delete(req, res, next) {

    await dbAction.destroy({
        where: {
            id: req.params.id
        }
    }).then(() => res.json({ message: (item + ' deleted successfully'), success: true }))
        .catch(err => {
            res.json({ message: ('Error Deleting ' + item ), success: false })
        });
}

// helper functions

async function getRecord(id) {
    const entry = await dbAction.findByPk(id);
    if (!entry) throw 'Entry not found';
    return entry;
}
