const express = require('express');
const router = express.Router();
const componentsCtrl = require('../controllers/components');
const verifyToken = require('../serverAuth.js').verifyToken;

componentsCtrl.initialize();
componentsCtrl.start();

//authenticate the following routes
router.use(verifyToken);

/////////////////////////////
// /status
// returns the status

//status
router.get('/status', (req, res) => {
    let currentStatus = {};
    currentStatus.ts = new Date().getTime();

    let keys = ['temp_local', 'humidity_local', 'temp_remote0', 'humidity_remote0', 'presistor_remote0', 'led', 'relay1', 'relay2'];

    for (key of keys) {
        currentStatus[key] = component[key].value;
    }

    res.status(200).json(currentStatus);

});

/////////////////////////////
// /component_state
// returns the component state

router.get('/component/:id', (req, res) => {
    //console.log('GET component');
    console.log(req.params);

    let comp = req.params.id;
    console.log({status: component[comp].status, value: component[comp].value});
    res.json({status: component[comp].status, value: component[comp].value});
});

/////////////////////////////
// /component_on
// returns the component state

router.post('/component_on/:id', (req, res) => {
    let comp = req.params.id;
    console.log('component_on:' + comp);
    console.log(req.params);

    if (component[comp].low_on) {
        component[comp].pin.writeSync(0);
    } else {
        console.log("here 1");
        component[comp].pin.writeSync(1);
    }
    component[comp].status = true;
    component[comp].value = true;
    res.json({status: true});

    //console.log("component:on");

});

/////////////////////////////
// /component_off
// returns the component state

router.post('/component_off/:id', (req, res) => {

    let comp = req.params.id;

    if (component[comp].low_on) {
        component[comp].pin.writeSync(1);
    } else {
        component[comp].pin.writeSync(0);
    }

    component[comp].status = false;
    component[comp].value = false;
    currentStatus[comp] = false;
    res.json({status: true});

});

module.exports = router;
