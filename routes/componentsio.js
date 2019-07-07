const ComponentsCtrl = require('../controllers/components');
const verifyToken = require('../serverAuth.js').verifyToken;

//start updating components at regular intervals
let componentsCtrl = new ComponentsCtrl();
componentsCtrl.init();
componentsCtrl.start();

module.exports = function (io) {
//Establish a client connection
    io.on('connection', client => {
        console.log('client connected in componentsio');

        //updates
        client.on('subscribeToUpdates', (interval) => {
            console.log('client is subscribing to updates with interval ', interval);

            setInterval(() => {
                //client.emit('updates', new Date());
                client.emit('updates', componentsCtrl.currentStatus());
            }, interval);

        });

        client.on('componentGetStatus', comp => {
            client.emit('componentStatusUpdate', {component: comp, isOpen: false});
        });

        //component off
        client.on('turnComponentOff', comp => {
            console.log(comp);
            componentsCtrl.component[comp].off();
            client.emit('componentStatusUpdate', {component: comp, isOn: false});
        });

        //component on
        client.on('turnComponentOn', comp => {
            console.log(comp);
            componentsCtrl.component[comp].on();
            client.emit('componentStatusUpdate', {component: comp, isOn: true});
        });

        //garage open
        //component on
        client.on('componentOpen', comp => {
            //console.log(comp);
            componentsCtrl.component.garageRelay.open();
            client.emit('componentStatusUpdate', {component: comp, isOpen: true});
        });

        //componentsCtrl.component.garageRelay.open();

        //garage close
        client.on('componentClose', comp => {
            //console.log(comp);
            componentsCtrl.component.garageRelay.open();
            client.emit('componentStatusUpdate', {component: comp, isOpen: false});
        });




        //user disconnects
        client.on('disconnect', () => {

            console.log('client disconnected');
        });

    });
};
