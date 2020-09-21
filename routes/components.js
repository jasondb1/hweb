const express = require('express');
const router = express.Router();
const ComponentsCtrl = require('../controllers/components');
//const verifyToken = require('../serverAuth.js').verifyToken;
//const authorize = require('../middleware/authorize.js');
const authJwt = require('../middleware/auth-jwt.js');


let componentsCtrl = new ComponentsCtrl();
componentsCtrl.init();
//componentsCtrl.start();

//authenticate the following routes
//router.use(verifyToken);

//status
//TODO: Maybe request keys here in post instead
router.get('/status', [authJwt.verifyToken], (req, res) => {
    res.status(200).json(componentsCtrl.currentStatus());
});


router.get('/component/:id', [authJwt.verifyToken], (req, res) => {
console.log(req.params);
    let comp = req.params.id;
    console.log({status: component[comp].status, value: component[comp].value});
    res.json({status: component[comp].status, value: component[comp].value});
});


router.post('/component_on/:id', [authJwt.verifyToken], (req, res) => {
    let comp = req.params.id;
    componentsCtrl.component[comp].on();
    res.json({status: true});
});


router.post('/component_off/:id', [authJwt.verifyToken], (req, res) => {
    let comp = req.params.id;
    componentsCtrl.component[comp].off();
    res.json({status: true});

});

router.post('/open_garage', [authJwt.verifyToken], (req, res) => {
    componentsCtrl.component.garageRelay.open();
    res.json({status: true});
});

router.post('/close_garage', [authJwt.verifyToken], (req, res) => {
    componentsCtrl.component.garageRelay.open();
    res.json({status: true});
});

module.exports = router;
