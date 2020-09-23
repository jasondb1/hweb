module.exports = (sequelize, type) => {
    const PlantedCrops = sequelize.define('plantedcrops', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        CropId: {
            type: type.INTEGER,
            allowNull: false
        },
        BedId: {
            type: type.INTEGER,
            allowNull: true
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
        Notes: {
            type: type.STRING
        },
        PlantedDate: {
            type: type.DATE
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