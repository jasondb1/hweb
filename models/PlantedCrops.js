module.exports = (sequelize, type) => {
    const PlantedCrops = sequelize.define('plantedcrops', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        PlantingDate: {
            type: type.DATE
        },
        DirectSeed: {
            type: type.BOOLEAN
        },
        Transplanted: {
            type: type.BOOLEAN
        },
        Perennial: {
            type: type.BOOLEAN
        },
        Notes: {
            type: type.STRING
        },
        EarliestHarvestDate: {
            type: type.DATE
        },
        LatestHarvestDate: {
            type: type.DATE
        },
        DateGerminated: {
            type: type.DATE
        },
        PlantedBy: {
            type: type.INTEGER
        },
    })

    return PlantedCrops;
};