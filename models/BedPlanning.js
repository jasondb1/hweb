module.exports = (sequelize, type) => {
    const BedHistory = sequelize.define('bedplanning', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        BedId: {
            type: type.INTEGER,
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

    return BedHistory;
};