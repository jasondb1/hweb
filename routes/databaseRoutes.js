const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/auth-jwt.js');
//const databaseService = require('../helpers/databaseService.js');

const bedDbService = require('../helpers/bedDbService.js');
const bedhistoryDbService = require('../helpers/bedhistoryDbService.js');
const bedplanningDbService = require('../helpers/bedplanningDbService.js');
const cropDbService = require('../helpers/cropDbService.js');
const customerDbService = require('../helpers/customerDbService.js');
const farmDbService = require('../helpers/farmDbService.js');
const greenhouseDbService = require('../helpers/greenhouseDbService.js');
const harvestDbService = require('../helpers/harvestDbService.js');
const nurseryDbService = require('../helpers/nurseryDbService.js');
const orderitemsDbService = require('../helpers/orderitemsDbService.js');
const ordersDbService = require('../helpers/ordersDbService.js');
const plantedcropDbService = require('../helpers/plantedcropsDbService.js');
const salesDbService = require('../helpers/salesDbService.js');
const sensordataDbService = require('../helpers/sensordataDbService.js');
const sensorDbService = require('../helpers/sensorDbService.js');
const solditemsDbService = require('../helpers/solditemsDbService.js');
const storageDbService = require('../helpers/storageDbService.js');
const taskitemDbService = require('../helpers/taskitemDbService.js');
const tasklistDbService = require('../helpers/tasklistDbService.js');
const alarmDbService = require('../helpers/alarmDbService.js');

// routes

//beds
router.post('/bed', [authJwt.verifyToken, authJwt.isAdmin], bedDbService.create);
router.get('/bed', [authJwt.verifyToken], bedDbService.getAll);
router.get('/bednames', [authJwt.verifyToken], bedDbService.getNames);
router.get('/bed/:id', [authJwt.verifyToken], bedDbService.getById);
router.put('/bed/:id', [authJwt.verifyToken], bedDbService.update);
router.delete('/bed/:id', [authJwt.verifyToken], bedDbService._delete);

//bedhistory
router.post('/bedhistory', [authJwt.verifyToken, authJwt.isAdmin], bedhistoryDbService.create);
router.get('/bedhistory', [authJwt.verifyToken], bedhistoryDbService.getAll);
router.get('/bedhistorynames', [authJwt.verifyToken], bedhistoryDbService.getNames);
router.get('/bedhistory/:id', [authJwt.verifyToken], bedhistoryDbService.getById);
router.put('/bedhistory/:id', [authJwt.verifyToken], bedhistoryDbService.update);
router.delete('/bedhistory/:id', [authJwt.verifyToken], bedhistoryDbService._delete);

//bedplanning
router.post('/bedplanning', [authJwt.verifyToken, authJwt.isAdmin], bedplanningDbService.create);
router.get('/bedplanning', [authJwt.verifyToken], bedplanningDbService.getAll);
router.get('/bedplanningnames', [authJwt.verifyToken], bedplanningDbService.getNames);
router.get('/bedplanning/:id', [authJwt.verifyToken], bedplanningDbService.getById);
router.put('/bedplanning/:id', [authJwt.verifyToken], bedplanningDbService.update);
router.delete('/bedplanning/:id', [authJwt.verifyToken], bedplanningDbService._delete);

//crop
router.post('/crop', [authJwt.verifyToken, authJwt.isAdmin], cropDbService.create);
router.get('/crop', [authJwt.verifyToken], cropDbService.getAll);
router.get('/cropnames', [authJwt.verifyToken], cropDbService.getNames);
router.get('/crop/:id', [authJwt.verifyToken], cropDbService.getById);
router.put('/crop/:id', [authJwt.verifyToken], cropDbService.update);
router.delete('/crop/:id', [authJwt.verifyToken], cropDbService._delete);

//customer
router.post('/customer', [authJwt.verifyToken, authJwt.isAdmin], customerDbService.create);
router.get('/customer', [authJwt.verifyToken], customerDbService.getAll);
router.get('/customernames', [authJwt.verifyToken], customerDbService.getNames);
router.get('/customer/:id', [authJwt.verifyToken], customerDbService.getById);
router.put('/customer/:id', [authJwt.verifyToken], customerDbService.update);
router.delete('/customer/:id', [authJwt.verifyToken], customerDbService._delete);

//greenhouse
router.post('/greenhouse', [authJwt.verifyToken, authJwt.isAdmin], greenhouseDbService.create);
router.get('/greenhouse', [authJwt.verifyToken], greenhouseDbService.getAll);
router.get('/greenhousenames', [authJwt.verifyToken], greenhouseDbService.getNames);
router.get('/greenhouse/:id', [authJwt.verifyToken], greenhouseDbService.getById);
router.put('/greenhouse/:id', [authJwt.verifyToken], greenhouseDbService.update);
router.delete('/greenhouse/:id', [authJwt.verifyToken], greenhouseDbService._delete);

//harvest
router.post('/harvest', [authJwt.verifyToken, authJwt.isAdmin], harvestDbService.create);
router.get('/harvest', [authJwt.verifyToken], harvestDbService.getAll);
router.get('/harvestnames', [authJwt.verifyToken], harvestDbService.getNames);
router.get('/harvest/:id', [authJwt.verifyToken], harvestDbService.getById);
router.put('/harvest/:id', [authJwt.verifyToken], harvestDbService.update);
router.delete('/harvest/:id', [authJwt.verifyToken], harvestDbService._delete);

//nursery
router.post('/nursery', [authJwt.verifyToken, authJwt.isAdmin], nurseryDbService.create);
router.get('/nursery', [authJwt.verifyToken], nurseryDbService.getAll);
router.get('/nurserynames', [authJwt.verifyToken], nurseryDbService.getNames);
router.get('/nursery/:id', [authJwt.verifyToken], nurseryDbService.getById);
router.put('/nursery/:id', [authJwt.verifyToken], nurseryDbService.update);
router.delete('/nursery/:id', [authJwt.verifyToken], nurseryDbService._delete);

//orderitems
router.post('/orderitems', [authJwt.verifyToken, authJwt.isAdmin], orderitemsDbService.create);
router.get('/orderitems', [authJwt.verifyToken], orderitemsDbService.getAll);
router.get('/orderitemsnames', [authJwt.verifyToken], orderitemsDbService.getNames);
router.get('/orderitems/:id', [authJwt.verifyToken], orderitemsDbService.getById);
router.put('/orderitems/:id', [authJwt.verifyToken], orderitemsDbService.update);
router.delete('/orderitems/:id', [authJwt.verifyToken], orderitemsDbService._delete);

//orders
router.post('/orders', [authJwt.verifyToken, authJwt.isAdmin], ordersDbService.create);
router.get('/orders', [authJwt.verifyToken], ordersDbService.getAll);
router.get('/ordersnames', [authJwt.verifyToken], ordersDbService.getNames);
router.get('/orders/:id', [authJwt.verifyToken], ordersDbService.getById);
router.put('/orders/:id', [authJwt.verifyToken], ordersDbService.update);
router.delete('/orders/:id', [authJwt.verifyToken], ordersDbService._delete);

//plantedcrop
router.post('/plantedcrop', [authJwt.verifyToken, authJwt.isAdmin], plantedcropDbService.create);
router.get('/plantedcrop', [authJwt.verifyToken], plantedcropDbService.getAll);
router.get('/plantedcropnames', [authJwt.verifyToken], plantedcropDbService.getNames);
router.get('/plantedcrop/:id', [authJwt.verifyToken], plantedcropDbService.getById);
router.put('/plantedcrop/:id', [authJwt.verifyToken], plantedcropDbService.update);
router.delete('/plantedcrop/:id', [authJwt.verifyToken], plantedcropDbService._delete);

//sales
router.post('/sales', [authJwt.verifyToken, authJwt.isAdmin], salesDbService.create);
router.get('/sales', [authJwt.verifyToken], salesDbService.getAll);
router.get('/salesnames', [authJwt.verifyToken], salesDbService.getNames);
router.get('/sales/:id', [authJwt.verifyToken], salesDbService.getById);
router.put('/sales/:id', [authJwt.verifyToken], salesDbService.update);
router.delete('/sales/:id', [authJwt.verifyToken], salesDbService._delete);

//sensor
router.post('/sensor', [authJwt.verifyToken, authJwt.isAdmin], sensorDbService.create);
router.get('/sensor', [authJwt.verifyToken], sensorDbService.getAll);
router.get('/sensornames', [authJwt.verifyToken], sensorDbService.getNames);
router.get('/sensor/:id', [authJwt.verifyToken], sensorDbService.getById);
router.put('/sensor/:id', [authJwt.verifyToken], sensorDbService.update);
router.delete('/sensor/:id', [authJwt.verifyToken], sensorDbService._delete);

//sensordata
router.post('/sensordata', [authJwt.verifyToken, authJwt.isAdmin], sensordataDbService.create);
router.get('/sensordata', [authJwt.verifyToken], sensordataDbService.getAll);
router.get('/sensordatanames', [authJwt.verifyToken], sensordataDbService.getNames);
router.get('/sensordata/:id', [authJwt.verifyToken], sensordataDbService.getById);
router.put('/sensordata/:id', [authJwt.verifyToken], sensordataDbService.update);
router.delete('/sensordata/:id', [authJwt.verifyToken], sensordataDbService._delete);

//solditems
router.post('/solditems', [authJwt.verifyToken, authJwt.isAdmin], solditemsDbService.create);
router.get('/solditems', [authJwt.verifyToken], solditemsDbService.getAll);
router.get('/solditemsnames', [authJwt.verifyToken], solditemsDbService.getNames);
router.get('/solditems/:id', [authJwt.verifyToken], solditemsDbService.getById);
router.put('/solditems/:id', [authJwt.verifyToken], solditemsDbService.update);
router.delete('/solditems/:id', [authJwt.verifyToken], solditemsDbService._delete);

//storage
router.post('/storage', [authJwt.verifyToken, authJwt.isAdmin], storageDbService.create);
router.get('/storage', [authJwt.verifyToken], storageDbService.getAll);
router.get('/storagenames', [authJwt.verifyToken], storageDbService.getNames);
router.get('/storage/:id', [authJwt.verifyToken], storageDbService.getById);
router.put('/storage/:id', [authJwt.verifyToken], storageDbService.update);
router.delete('/storage/:id', [authJwt.verifyToken], storageDbService._delete);

//taskitems
router.post('/taskitems', [authJwt.verifyToken, authJwt.isAdmin], taskitemDbService.create);
router.get('/taskitems', [authJwt.verifyToken], taskitemDbService.getAll);
router.get('/taskitemsnames', [authJwt.verifyToken], taskitemDbService.getNames);
router.get('/taskitems/:id', [authJwt.verifyToken], taskitemDbService.getById);
router.put('/taskitems/:id', [authJwt.verifyToken], taskitemDbService.update);
router.delete('/taskitems/:id', [authJwt.verifyToken], taskitemDbService._delete);

//tasklist
router.post('/tasklist', [authJwt.verifyToken, authJwt.isAdmin], tasklistDbService.create);
router.get('/tasklist', [authJwt.verifyToken], tasklistDbService.getAll);
router.get('/tasklistnames', [authJwt.verifyToken], tasklistDbService.getNames);
router.get('/tasklist/:id', [authJwt.verifyToken], tasklistDbService.getById);
router.put('/tasklist/:id', [authJwt.verifyToken], tasklistDbService.update);
router.delete('/tasklist/:id', [authJwt.verifyToken], tasklistDbService._delete);

//farms
router.post('/farm', [authJwt.verifyToken, authJwt.isAdmin], farmDbService.create);
router.get('/farm', [authJwt.verifyToken], farmDbService.getAll);
router.get('/farmnames', [authJwt.verifyToken], farmDbService.getNames);
router.get('/farm/:id', [authJwt.verifyToken], farmDbService.getById);
router.put('/farm/:id', [authJwt.verifyToken], farmDbService.update);
router.delete('/farm/:id', [authJwt.verifyToken], farmDbService._delete);

//farms
router.post('/alarm', [authJwt.verifyToken, authJwt.isAdmin], alarmDbService.create);
router.get('/alarm', [authJwt.verifyToken], alarmDbService.getAll);
router.get('/alarmnames', [authJwt.verifyToken], alarmDbService.getNames);
router.get('/alarm/:id', [authJwt.verifyToken], alarmDbService.getById);
router.put('/alarm/:id', [authJwt.verifyToken], alarmDbService.update);
router.delete('/alarm/:id', [authJwt.verifyToken], alarmDbService._delete);

module.exports = router;