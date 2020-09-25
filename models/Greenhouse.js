module.exports = (sequelize, type) => {
    const Greenhouse = sequelize.define('greenhouse', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        FarmName: {
            type: type.STRING,
            allowNull: false
        },
        Location: {
            type: type.STRING
        },
        CreatedDate: {
            type: type.DATE
        },
        Length: {
            type: type.INTEGER
        },
        Width: {
            type: type.INTEGER
        },
        Height: {
            type: type.INTEGER
        },
        Description: {
            type: type.STRING
        },
        Active: {
            type: type.BOOLEAN
        },
    })

    return Greenhouse;
};