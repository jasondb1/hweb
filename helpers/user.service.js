const secret = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models/Sequelize.js');

//TODO: pass in database to functions from main server.js

module.exports = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    //create1
};

async function authenticate({ username, password }) {

    //console.log("authenticating password");
    const user = await db.User.scope('withHash').findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.hash))) {
        throw 'Username or password is incorrect';
    }

    // authentication successful
    const token = jwt.sign({ sub: user.id }, secret, { expiresIn: '7d' });
    //return { ...omitHash(user.get()), token };
    return { ...omitHash(user), token };
}

async function getAll() {
    return await db.User.findAll();
}

async function getById(id) {
    return await getUser(id);
}

async function create(params) {
    // validate
    //console.log("create user");
    //console.log(params);
    if (params.admin === 'on')
        params.admin = 1;

    if (await db.User.findOne({ where: { username: params.username } })) {
        throw 'Username "' + params.username + '" is already taken';
    }

    // hash password
    if (params.password) {
        params.hash = await bcrypt.hash(params.password, 10);
    }

    // save user
    await db.User.create(params);
}

// async function create1(database, params) {
//     // validate
//     console.log("in create 1");
//     console.log(database.User);
//     console.log(params);

//     if (await database.User.findOne({ where: { username: params.username } })) {
//         throw 'Username "' + params.username + '" is already taken';
//     }

//     // hash password
//     if (params.password) {
//         params.hash = await bcrypt.hash(params.password, 10);
//     }

//     // save user
//     await database.User.create(params);
// }

async function update(id, params) {
    
    // validate
    const user = await getUser(id);
    console.log(user);
    const usernameChanged = params.username && user.username !== params.username;
    if (usernameChanged && await db.User.findOne({ where: { username: params.username } })) {
        throw 'Username "' + params.username + '" is already taken';
    }

    // hash password if it was entered
    if (params.password) {
        params.hash = await bcrypt.hash(params.password, 10);
    }

    // copy params to user and save
    //Object.assign(user, params);
    //await user.save();

    // Change User
    await db.User.update(params, {
        where: {
            id: id
        }
    });

    //return omitHash(user.get());
    return omitHash(user);
}

async function _delete(id) {
    //const user = await getUser(id);
    //console.log(user);
    await db.User.destroy({
        where: {
            id: id
        }
    });
}

// helper functions

async function getUser(id) {
    const user = await db.User.findByPk(id);
    if (!user) throw 'User not found';
    return user;
}

function omitHash(user) {
    //console.log("in omithash")
    //console.log(user);
    //const { hash, ...userWithoutHash } = user;
    const { hash, ...userWithoutHash } = user;
    //console.log(userWithoutHash);
    return userWithoutHash;
}