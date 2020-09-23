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
        NickName: {
            type: type.STRING
        },
        Type: {
            type: type.STRING
        },
        Location: {
            type: type.STRING
        },
        FarmId: {
            type: type.INTEGER,
            allowNull: false
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
        LightDescription: {
            type: type.STRING
        },

    })

    return Bed;
};