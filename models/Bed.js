module.exports = (sequelize, type) => {
    const Bed = sequelize.define('bed', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Description: {
            type: type.STRING,
            allowNull: true
        },
        Tags: {
            type: type.STRING
        },
        Type: {
            type: type.STRING
        },
        BedLocation: {
            type: type.STRING
        },
        ActiveBed: {
            type: type.BOOLEAN
        },
        Length: {
            type: type.INTEGER
        },
        Width: {
            type: type.INTEGER
        },
        ReservoirVolume: {
            type: type.INTEGER
        },
        LightType: {
            type: type.STRING
        },

    })

    return Bed;
};