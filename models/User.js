module.exports = (sequelize, type) => {
    const User = sequelize.define('User', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        admin: type.BOOLEAN,
        name: type.STRING,
        first_name: type.STRING,
        last_name: type.STRING,
        email: {
            type: type.STRING,
            allowNull: false,
            unique: true
        },
        username: {
            type: type.STRING,
            allowNull: false,
            unique: true
        },
        hash: {
            type: type.STRING,
            allowNull: false
        },
    },
        {//options
            defaultScope: {
                // exclude hash by default
                attributes: { exclude: ['hash'] }
            },
            scopes: {
                // include hash with this scope
                withHash: { attributes: {}, }
            }
        }
    )

    return User;

};