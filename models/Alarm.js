module.exports = (sequelize, type) => {
    const Alarm = sequelize.define('alarm', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Description: {
            type: type.STRING
        },
        Email: {
            type: type.STRING
        },
        Type: {
            type: type.STRING
        },
        // Sensor: {
        //     type: type.String
        // },
        Threshold: {
            type: type.FLOAT
        },
        AlarmDate: {
            type: type.DATE
        },
        Recurrence: {
            type: type.INTEGER
        },
    })

    return Alarm;
};