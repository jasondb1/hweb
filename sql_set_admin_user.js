require('dotenv').config();
const { delay } = require('bluebird');
const userService = require('./helpers/user.service.js');
const database = require('./models/Sequelize.js');
const bcrypt = require('bcryptjs');
//const bcrypt = require('bcrypt-nodejs');

newUser = { username: 'admin', password: 'Passw0rd', email: 'admin@test.com', admin: true };

console.log("database in sql set admin");
create(database, newUser);

async function create(database, params) {
    // validate

    if (await database.User.findOne({ where: { username: params.username } })) {
        throw 'Username "' + params.username + '" is already taken';
    }

    console.log("username is good");

    // hash password
    if (params.password) {
        params.hash = await bcrypt.hash(params.password, 10);
    }
    console.log("hash:");
    console.log(params.hash);

    // save user
    await database.User.create(params);

    console.log("Set Admin user and password")
    console.log("user: admin")
    console.log("password: passw0rd")

};

// console.log("in sql_set_admin_user");
// let db
// database.initDB().then(() => {
//     console.log("db initialized1");
//     db = database.getDB()

// }
// ).then(() => {
//     //console.log(db);
//     create1(db, newUser);
// }).catch(console.log("issue"));

// let db;
// database.initDB().then((db) =>{
//     console.log("initDB");
//     console.log(db);

// })


//console.log(db);

//db = database.getDB();
//create1(db, newUser);

//console.log("db:");
//console.log(database);

// userService.create1(database, newUser)
//         .then(console.log ('admin user registered with password "Passw0rd" '))
//         .catch(console.log ("An error occured entering admin user"));



