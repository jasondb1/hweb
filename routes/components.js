const express = require('express');
const router = express.Router();
const componentsCtrl = require('../controllers/components');
const verifyToken = require('../serverAuth.js').verifyToken;

componentsCtrl.initialize();
componentsCtrl.start();

//authenticate the following routes
router.use(verifyToken);


//status
//TODO: Maybe request keys here in post instead
router.get('/status', (req, res) => {
    res.status(200).json(componentsCtrl.currentStatus());
});


router.get('/component/:id', (req, res) => {
    console.log(req.params);
    let comp = req.params.id;
    console.log({status: component[comp].status, value: component[comp].value});
    res.json({status: component[comp].status, value: component[comp].value});
});


router.post('/component_on/:id', (req, res) => {
    let comp = req.params.id;
    componentsCtrl.componentOn(comp);
    res.json({status: true});
});


router.post('/component_off/:id', (req, res) => {
    let comp = req.params.id;
    componentsCtrl.componentOff(comp);
    res.json({status: true});

});

module.exports = router;
