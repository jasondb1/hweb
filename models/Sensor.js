module.exports = (sequelize, type) => {
    const Sensor = sequelize.define('sensor', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        BedId: {
            type: type.INTEGER,
        },
        Timestamp: {
            type: type.DATE
        },
        Sensor: {
            type: type.STRING,
            allowNull: false
        },
        Location: {
            type: type.STRING
        },
        SensorId: {
            type: type.INTEGER
        },
        Value: {
            type: type.FLOAT,
        },
        Location: {
            type: type.STRING
        }
    })

  return Sensor;  
};