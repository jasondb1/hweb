module.exports = (sequelize, type) => {
    const BedPlanning = sequelize.define('bedplanning', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        PlannedDate: {
            type: type.DATE
        },
        ExpiredDate: {
            type: type.DATE
        },
        Recurrence: {
            type: type.FLOAT,
        },
        Action: {
            type: type.STRING
        },
        Amount: {
            type: type.FLOAT,
        },
        Units: {
            type: type.STRING
        },
        Notes: {
            type: type.STRING,
        },
    })

    return BedPlanning;
};