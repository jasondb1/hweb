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
    return { ...omitHash(user), token };
}

async function getAll() {
    return await db.User.findAll();
}

async function getById(id) {
    return await getUser(id);
}

async function create(params) {
    
    // validate (Add more if needed)
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
    let newUserId;
    await db.User.create(params).then(user => newUserId = user.id);
    const user = await getUser(newUserId);
    return omitHash(user);
}

async function update(id, params) {

    if (params.admin === 'on')
        params.admin = 1;

    // validate
    let user = await getUser(id);
    const usernameChanged = params.username && user.username !== params.username;
    if (usernameChanged && await db.User.findOne({ where: { username: params.username } })) {
        throw 'Username "' + params.username + '" is already taken';
    }

    // hash password if it was entered
    if (params.password) {
        params.hash = await bcrypt.hash(params.password, 10);
    }

    // Change User
    await db.User.update(params, {
        where: {
            id: id
        }
    });

    //reload updateduser
    user = await getUser(id);
    return omitHash(user);
}

async function _delete(id) {
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
    const { hash, ...userWithoutHash } = user;
    return userWithoutHash;
}