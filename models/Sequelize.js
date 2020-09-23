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


//Relations
//db.sensor.belongsTo(db.x, {as: "Something", foreignKey:"userID"})
//db.x.hasmany(db.x)
//db.x.hasOne(db.x)
db.Role.belongsToMany(db.User, {
  through: "user_roles",
  foreignKey: "roleId",
  otherKey: "userId"
});

db.User.belongsToMany(db.Role, {
  through: "user_roles",
  foreignKey: "userId",
  otherKey: "roleId"
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