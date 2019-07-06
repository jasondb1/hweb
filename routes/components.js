const express = require('express');
const router = express.Router();
const ComponentsCtrl = require('../controllers/components');
const verifyToken = require('../serverAuth.js').verifyToken;

let componentsCtrl = new ComponentsCtrl();
componentsCtrl.init();
componentsCtrl.start();
//console.log(componentsCtrl);

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
console.log(comp);
	console.log(componentsCtrl.component);
    componentsCtrl.component[comp].off();
    //componentsCtrl.componentOn(comp);
    res.json({status: true});
});


router.post('/component_off/:id', (req, res) => {
    let comp = req.params.id;
    	console.log(comp);
	console.log(componentsCtrl.component);
	componentsCtrl.component[comp].off();
    //componentsCtrl.componentOff(comp);
    res.json({status: true});

});

router.post('/open_garage', (req, res) => {
    componentsCtrl.component.garageRelay.open();
    res.json({status: true});
});

router.post('/close_garage', (req, res) => {
    componentsCtrl.component.garageRelay.open();
    res.json({status: true});
});

module.exports = router;
