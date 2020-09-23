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

//Relations
//db.sensor.belongsTo(db.x, {as: "Something", foreignKey:"userID"})
//db.x.hasmany(db.x, {as: 'employes'} ) 1:n
//db.x.hasmany(db.x, ) 
//db.x.hasOne(db.x, ) 1:1
//User.belongsTo(models.Company, {foreignKey: 'companyId', as: 'company'})
//Company.hasMany(models.User, {as: 'employes'})
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



//console.log(db);
//console.log("before sync");

let test = sequelize.authenticate()
  .then(function () {
    console.log("MariaDB CONNECTED! ");
  })
  .catch(function (err) {
    console.log("SOMETHING WENT WRONG! CONNECTING:", err);
  });


db.sequelize.sync({ alter: true })
  .then(function () {
    console.log("MariaDB Synchronized! ");
  })
  .catch(() => {
    console.log("error during sync")
  })


// .then(() => {
//   console.log('tables created/altered');
//   _db = db;
// })

//initialize(db);

module.exports = db;