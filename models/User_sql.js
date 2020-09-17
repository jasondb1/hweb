module.exports = (sequelize, type) => {
    User = sequelize.define('user', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        admin: type.BOOLEAN,
        first_name: type.STRING,
        last_name: type.STRING,
        email: type.STRING,
        username: {
            type: type.STRING,
            allowNull: false
        },
        password: {
            type: type.STRING,
            allowNull: false
        }
    })

    return User;

};