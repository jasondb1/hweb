const Sequelize = require('sequelize');

//let _db;

const sequelize = new Sequelize(
  process.env.DBNAME,
  process.env.DBUSER,
  process.env.DBPASSWORD, {
  host: process.env.DBHOST,
  dialect: process.env.DBDIALECT,
  logging: false,
  pool: {
    max: 10,
    min: 0,
    idle: 30000,
    acquire: 60000
  },
  dialectOptions: {
    encrypt: true
  },
  //timezone: "Canada/Mountain",
  query: { raw: true }
}
);

// function initialize() {
//   //console.log("in initialize");
//   //console.log(db);
//   db.Role.create({
//     id: 1,
//     name: "user"
//   });

//   db.Role.create({
//     id: 2,
//     name: "moderator"
//   });

//   db.Role.create({
//     id: 3,
//     name: "admin"
//   });
// }

// Connect all the models/tables in the database to a db object, 
//so everything is accessible via one object
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//models/tables here
db.SensorData = require("./SensorData.js")(sequelize, Sequelize);
db.Sensor = require("./Sensor.js")(sequelize, Sequelize);
db.User = require("./User.js")(sequelize, Sequelize);
db.Role = require("./Role.js")(sequelize, Sequelize);
db.Bed = require("./Bed.js")(sequelize, Sequelize);
db.BedHistory = require("./BedHistory.js")(sequelize, Sequelize);
db.BedPlanning = require("./BedPlanning.js")(sequelize, Sequelize);
db.Crops = require("./Crops.js")(sequelize, Sequelize);
db.Customer = require("./Customer.js")(sequelize, Sequelize);
db.Farm = require("./Farm.js")(sequelize, Sequelize);
db.Greenhouse = require("./Greenhouse.js")(sequelize, Sequelize);
db.Harvest = require("./Harvest.js")(sequelize, Sequelize);
db.Nursery = require("./Nursery.js")(sequelize, Sequelize);
db.OrderItems = require("./OrderItems.js")(sequelize, Sequelize);
db.Orders = require("./Orders.js")(sequelize, Sequelize);
db.PlantedCrops = require("./PlantedCrops.js")(sequelize, Sequelize);
db.Sales = require("./Sales.js")(sequelize, Sequelize);
db.SoldItems = require("./SoldItems.js")(sequelize, Sequelize);
db.Storage = require("./Storage.js")(sequelize, Sequelize);
db.TaskList = require("./TaskList.js")(sequelize, Sequelize);
db.TaskItem = require("./TaskItem.js")(sequelize, Sequelize);

//Relations

db.Role.belongsToMany(db.User, {
  through: "user_roles",
  foreignKey: "roleId",
  //otherKey: "userId"
});

db.User.belongsToMany(db.Role, {
  through: "user_roles",
  foreignKey: "userId",
  //otherKey: "roleId"
});

db.TaskItem.belongsTo(db.TaskList);
db.TaskList.hasMany(db.TaskItem);
db.TaskList.belongsTo(db.Farm);
db.Farm.hasMany(db.TaskList);

//db.SensorData.hasMany(db.Sensor);
//db.Sensor.belongsTo(db.SensorData);

db.Bed.hasMany(db.Sensor);
db.Sensor.belongsTo(db.Bed);

db.Greenhouse.hasMany(db.Sensor);
db.Sensor.belongsTo(db.Greenhouse);

db.Nursery.hasMany(db.Sensor);
db.Sensor.belongsTo(db.Nursery);

db.Farm.hasMany(db.Bed);
db.Bed.belongsTo(db.Farm);

db.Bed.hasMany(db.BedHistory);
db.BedHistory.belongsTo(db.Bed);

db.PlantedCrops.hasMany(db.Bed);
db.Bed.belongsTo(db.PlantedCrops);

db.PlantedCrops.hasMany(db.Crops);
db.Crops.belongsTo(db.PlantedCrops);

// db.PlantedCrops.belongsToMany(db.Bed, {
//   through: "planted_beds",
//   //foreignKey: "userId",
//   //otherKey: "roleId"
// });
// db.Bed.belongsToMany(db.PlantedCrops, {
//   through: "planted_beds",
//   //foreignKey: "userId",
//   //otherKey: "roleId"
// });

// db.PlantedCrops.belongsToMany(db.Crops, {
//   through: "planted_crops",
//   //foreignKey: "userId",
//   //otherKey: "roleId"
// });
// db.Crops.belongsToMany(db.PlantedCrops, {
//   through: "planted_crops",
//   //foreignKey: "userId",
//   //otherKey: "roleId"
// });

db.Bed.belongsToMany(db.Harvest, {
  through: "harv_beds",
  //foreignKey: "userId",
  //otherKey: "roleId"
});
db.Harvest.belongsToMany(db.Bed, {
  through: "harv_beds",
  //foreignKey: "userId",
  //otherKey: "roleId"
});

db.Harvest.hasMany(db.Crops);
db.Crops.belongsTo(db.Harvest);

db.Farm.hasMany(db.Greenhouse);
db.Greenhouse.belongsTo(db.Farm);

db.Customer.hasMany(db.Sales);
db.Sales.belongsTo(db.Customer);

db.Customer.hasMany(db.Orders);
db.Orders.belongsTo(db.Customer);

db.Nursery.hasMany(db.Crops);
db.Crops.belongsTo(db.Nursery);

db.Farm.hasMany(db.User);
db.User.belongsTo(db.Farm);

db.BedPlanning.hasMany(db.Crops);
db.Crops.belongsTo(db.BedPlanning);

db.BedPlanning.hasMany(db.Bed);
db.Bed.belongsTo(db.BedPlanning);

db.Farm.hasMany(db.Nursery);
db.Nursery.belongsTo(db.Farm);

db.Nursery.hasMany(db.Bed);
db.Bed.belongsTo(db.Nursery);

db.Farm.hasMany(db.Customer);
db.Customer.belongsTo(db.Farm);

db.Farm.hasMany(db.Crops);
db.Crops.belongsTo(db.Farm);

db.Greenhouse.hasMany(db.Bed);
db.Bed.belongsTo(db.Greenhouse);

db.Storage.belongsToMany(db.Crops, {
  through: "stored_crops",
  //foreignKey: "userId",
  //otherKey: "roleId"
});
db.Crops.belongsToMany(db.Storage, {
  through: "stored_crops",
  //foreignKey: "userId",
  //otherKey: "roleId"
});


db.SoldItems.hasMany(db.Crops);
db.Crops.belongsTo(db.SoldItems);

db.Orders.hasMany(db.OrderItems);
db.OrderItems.belongsTo(db.Orders);

db.Sales.hasMany(db.SoldItems);
db.SoldItems.belongsTo(db.Sales);

db.SoldItems.hasMany(db.Crops);
db.Crops.belongsTo(db.SoldItems);

db.OrderItems.hasMany(db.Crops);
db.Crops.belongsTo(db.OrderItems);

//good to here

// db.Bed.belongsToMany(db.SensorData, {
//   through: "bed_sensors",
//   //foreignKey: "userId",
//   //otherKey: "roleId"
// });
// db.SensorData.belongsToMany(db.Bed, {
//   through: "bed_sensors",
//   //foreignKey: "userId",
//   //otherKey: "roleId"
// });


// db.Harvest.belongsToMany(db.Crops, {
//   through: "harvested_crops",
//   //foreignKey: "userId",
//   //otherKey: "roleId"
// });
// db.Crops.belongsToMany(db.Harvest, {
//   through: "harvested_crops",
//   //foreignKey: "userId",
//   //otherKey: "roleId"
// });
//console.log(db);
//console.log("before sync");

let test = sequelize.authenticate()
  .then(function () {
    console.log("MariaDB CONNECTED! ");
  })
  .catch(function (err) {
    console.log("SOMETHING WENT WRONG! CONNECTING:", err);
  });


//db.sequelize.sync({ force: true })
//db.sequelize.sync({ alter: true })
db.sequelize.sync()
  .then(function () {
    console.log("MariaDB Synchronized! ");
  })
  .catch(() => {
    console.log("error during sync")
  })

//initialize(db);

module.exports = db;