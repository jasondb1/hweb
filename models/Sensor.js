module.exports = (sequelize, type) => {
    const Sensor = sequelize.define('sensor', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Sensor: {
            type: type.STRING,
            allowNull: false
        },
        Description: {
            type: type.STRING
        },
        Location: {
            type: type.STRING
        },
        Tag: {
            type: type.STRING
        },
        Type: {
            type: type.INTEGER
        },
        Status: {
            type: type.STRING
        },
        PollingRate: {
            type: type.STRING
        },
    })

    return Sensor;
};