const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../middleware/validate-request.js');
//const authorize = require('../middleware/authorize.js');
const authJwt = require('../middleware/auth-jwt.js');
const userService = require('../helpers/user.service.js');

// routes
//router.post('/authenticate', authenticateSchema, authenticate);
router.post('/authenticate', authenticateSchema, authenticate);
//router.post('/register', registerSchema, register); //Use this if non authenticated 
router.post('/register', [authJwt.verifyToken, authJwt.isAdmin], register);
router.get('/', [authJwt.verifyToken], getAll);
router.get('/current', [authJwt.verifyToken], getCurrent);
router.get('/:id', [authJwt.verifyToken], getById);
//router.put('/:id', [authJwt.verifyToken], updateSchema, update);
router.put('/:id', [authJwt.verifyToken], update);
router.delete('/:id', [authJwt.verifyToken], _delete);

module.exports = router;

function authenticateSchema(req, res, next) {
    //console.log("in authenticate schema");
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    });
    //console.log(schema);
    validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
    //console.log("in authenticate")
    userService.authenticate(req.body)
        .then(user => {res.json(user);
        //console.log(user); 
        })
        .catch(next);
}

function registerSchema(req, res, next) {
    //console.log("in regester schema");
    //console.log(req.body);
    const schema = Joi.object({
        email: Joi.string().required(),
        username: Joi.string().required(),
        password: Joi.string().min(6).required()
    });
    validateRequest(req, next, schema);
}

function register(req, res, next) {

    //TODO: Add error message to catch to send back to client
    userService.create(req.body)
        .then(() => res.json({ message: 'New User Added', success: true}))
        .catch(next);
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(next);
}

function getCurrent(req, res, next) {
    res.json(req.user);
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => res.json(user))
        .catch(next);
}

function updateSchema(req, res, next) {
    //TODO: update this scema
    const schema = Joi.object({
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        username: Joi.string().empty(''),
        password: Joi.string().min(6).empty('')
    });
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    //console.log("update user");
    //console.log(req.params.id);
    //console.log(req.body);
    userService.update(req.params.id, req.body)
        .then(() => res.json({ message: 'User updated successfully' , success: true}))
        .catch(next);
}

function _delete(req, res, next) {
    console.log ("delete user");
    console.log(req.params);
    userService.delete(req.params.id)
        .then(() => res.json({ message: 'User deleted successfully', success: true }))
        .catch(next);
}