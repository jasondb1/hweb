const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    'homeweb',
    'jd_admin',
    'pQvUM5ggebuw', {
        //host: 'jd-personal-dev.mariadb.database.azure.com',
        host: 'localhost',
        dialect: 'mariadb',
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
        query:{raw:true}
    }
);

let test = sequelize.authenticate()
    .then(function () {
        console.log("MariaDB CONNECTED! ");
    })
    .catch(function (err) {
        console.log("SOMETHING WENT WRONG! CONNECTING:", err);
    });

// Connect all the models/tables in the database to a db object, 
//so everything is accessible via one object
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

//models/tables here
db.user = require("./User_sql.js")(sequelize, Sequelize);
db.sensor = require("./Sensor.js")(sequelize, Sequelize);


//Relations
//db.sensor.belongsTo(db.x, {as: "Something", foreignKey:"userID"})
//db.x.hasmany(db.x)
//db.x.hasOne(db.x)

//Generic Error Handler 
const errHandler = err => {
  //Catch and log any error.
  console.error("Error: ", err);
};

//db.sensor.sync({force: true})
db.sensor.sync({force: true})
.then(() => {
    console.log('sensor table created');

    //db.sensor.create({
    //    Sensor: "test",
    //    Value: "12.23"
    //    })
    //    .then(//console.log("entry created")
    //    )
    //    .catch(errHandler) 
})

db.user.sync({force: true})
.then(() => {
    console.log('user table created');
})

module.exports = db;