const express = require('express');
const db = require('../models/Sequelize.js');
const databaseService = require('./old_databaseService.js');

module.exports = {
    create,
    getAll,
    getNames,
    getById,
    update,
    _delete,
};

function create(req, res, next) {

    //TODO: Add error message to catch to send back to client
    databaseService.create(req.body)
        .then((payload) => {
            res.json({ payload: payload, message: 'New Farm Added', success: true })
        })
        .catch(err => {
            res.json({ message: 'Error Adding Farm', success: false })
        });
}

function getAll(req, res, next) {
    databaseService.getAll()
        .then(payload => res.json(payload))
        .catch(err => {
            res.json({ message: 'Error Finding Farms', success: false })
        });
}

async function getNames(req, res, next) {

        await db.Farm.findAll(
            {
                attributes:
                    ['farmId', 'Description']
            }
        ).then(payload => res.json(payload) )
       .catch(err => {
            res.json({ message: 'Error Finding Farms', success: false })
        });
}

function getById(req, res, next) {
    databaseService.getById(req.params.id)
        .then(payload => res.json(payload))
        .catch(err => {
            res.json({ message: 'Error Retrieving Item', success: false })
        });
}

function update(req, res, next) {
    databaseService.update(req.params.id, req.body)
        .then((payload) => {
            res.json({ payload: payload, message: 'Farm updated successfully', success: true })

        })
        .catch(err => {
            // console.log("update unsuccessful");
            // console.log(err);
            res.json({ message: 'Error Adding Farm', success: false })
        });
}

function _delete(req, res, next) {
    databaseService.delete(req.params.id)
        .then(() => res.json({ message: 'Farm deleted successfully', success: true }))
        .catch(err => {
            res.json({ message: 'Error Deleting Farm', success: false })
        });
}

