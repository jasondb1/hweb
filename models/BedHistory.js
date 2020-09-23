module.exports = (sequelize, type) => {
    const BedHistory = sequelize.define('bedhistory', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        BedId: {
            type: type.INTEGER,
        },
        ActionDate: {
            type: type.DATE
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
        DoneBy: {
            type: type.INTEGER
        },
        Notes: {
            type: type.STRING,
        },
    })

    return BedHistory;
};