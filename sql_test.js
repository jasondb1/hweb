const Sequelize = require('sequelize');

console.log("Connecting");

const sequelize = new Sequelize(
    'homeweb',
    'jd_admin',
    'pQvUM5ggebuw', 
    {
        //host: 'jd-personal-dev.mariadb.database.azure.com',
        host: 'localhost',
        dialect: 'mariadb',
        logging: false,
        pool: {max: 10, min: 0, idle: 30000, acquire: 60000},
        dialectOptions: { encrypt: true},
        port: 3306
    }

);

let test = sequelize.authenticate()
    .then(function () {
        console.log("CONNECTED! ");
    })
    .catch(function (err) {
        console.log("SOMETHING DONE GOOFED:", err);
    });

console.log("Done Connecting");


// sequelize.authenticate().then(() => {
//   console.log('Connection established successfully.');
// }).catch(err => {
//   console.error('Unable to connect to the database:', err);
// }).finally(() => {
//   sequelize.close();
// });

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./models/User_sql.js")(sequelize, Sequelize);
db.sensor = require("./models/Sensor.js")(sequelize, Sequelize);

//Generic Error Handler 
const errHandler = err => {
  //Catch and log any error.
  console.error("Error: ", err);
};

db.sensor.sync({force: true})
.then(() => {
    console.log('sensor table created');

    //We also use await, you can use standard then callback.
        db.sensor.create({
        Sensor: "test",
        value: "12.23"
        })
        .then(console.log("entry created"))
        .catch(errHandler) 
})

db.user.sync({force: true})
.then(() => {
    console.log('user table created');

})



//models here
//db.users = require("./User_sql.js")(sequelize, Sequelize);
//db.sensor = require("./Sensor.js")(sequelize, Sequelize);




module.exports = db;
