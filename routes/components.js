const express = require('express');
const router = express.Router();
const ComponentsCtrl = require('../controllers/components');
//const verifyToken = require('../serverAuth.js').verifyToken;
const authorize = require('../middleware/authorize.js');

let componentsCtrl = new ComponentsCtrl();
componentsCtrl.init();
//componentsCtrl.start();

//authenticate the following routes
//router.use(verifyToken);

//status
//TODO: Maybe request keys here in post instead
router.get('/status', authorize(), (req, res) => {
    res.status(200).json(componentsCtrl.currentStatus());
});


router.get('/component/:id', authorize(), (req, res) => {
console.log(req.params);
    let comp = req.params.id;
    console.log({status: component[comp].status, value: component[comp].value});
    res.json({status: component[comp].status, value: component[comp].value});
});


router.post('/component_on/:id', authorize(), (req, res) => {
    let comp = req.params.id;
    componentsCtrl.component[comp].on();
    res.json({status: true});
});


router.post('/component_off/:id', authorize(), (req, res) => {
    let comp = req.params.id;
    componentsCtrl.component[comp].off();
    res.json({status: true});

});

router.post('/open_garage', authorize(), (req, res) => {
    componentsCtrl.component.garageRelay.open();
    res.json({status: true});
});

router.post('/close_garage', authorize(), (req, res) => {
    componentsCtrl.component.garageRelay.open();
    res.json({status: true});
});

module.exports = router;
