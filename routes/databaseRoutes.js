const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/auth-jwt.js');
const databaseService = require('../helpers/databaseService.js');

// routes

//router.post('/register', registerSchema, register); //Use this if non authenticated 
router.post('/farm', [authJwt.verifyToken, authJwt.isAdmin], create);
router.get('/farm', [authJwt.verifyToken], getAll);
router.get('/farm/:id', [authJwt.verifyToken], getById);
router.put('/farm/:id', [authJwt.verifyToken], update);
router.delete('/farm/:id', [authJwt.verifyToken], _delete);

module.exports = router;

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