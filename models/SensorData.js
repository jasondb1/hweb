module.exports = (sequelize, type) => {
    const SensorData = sequelize.define('sensordata', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        Value: {
            type: type.FLOAT,
        }
    })

  return SensorData;  
};