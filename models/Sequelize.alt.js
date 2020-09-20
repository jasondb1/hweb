const Sequelize = require('sequelize');

let _db;

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

async function getDB(callback) {

  if (_db) {
    return callback(_db);
  } else {
    initDB().then((db) => {
      return callback(db);
    });
  }

}

async function initDB(callback) {

  console.log("initializing db");
  // Connect all the models/tables in the database to a db object, 
  //so everything is accessible via one object
  const db = {};
  db.Sequelize = Sequelize;
  db.sequelize = sequelize;

  //models/tables here
  db.User = require("./User_sql.js")(sequelize, Sequelize);
  db.Role = require("./Role.js")(sequelize, Sequelize);
  db.Sensor = require("./Sensor.js")(sequelize, Sequelize);

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

  await db.sequelize.sync({ alter: true })
  // .then(() => {
  //   console.log('tables created/altered');
  //   _db = db;
  // })

  console.log('tables created/altered');
  initialize(db);
  return callback(_db);

  // sequelize.authenticate()
  //   .then(function () {
  //     console.log("MariaDB CONNECTED! ");
  //     _db = db;
  //   })
  //   .catch(function (err) {
  //     console.log("SOMETHING WENT WRONG! CONNECTING:", err);
  //   });

  //   return db;
}

function initialize(db) {
  //console.log("in initialize");
  //console.log(db);
  db.Role.create({
    id: 1,
    name: "user"
  });

  db.Role.create({
    id: 2,
    name: "moderator"
  });

  db.Role.create({
    id: 3,
    name: "admin"
  });
}

//db.sensor.sync({force: true})
// db.sensor.sync({alter: true})
// .then(() => {
//     console.log('sensor table altered/created');

//     //db.sensor.create({
//     //    Sensor: "test",
//     //    Value: "12.23"
//     //    })
//     //    .then(//console.log("entry created")
//     //    )
//     //    .catch(errHandler) 
// })



module.exports = { getDB, initDB };