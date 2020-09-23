module.exports = (sequelize, type) => {
    const Crop = sequelize.define('crop', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        CropName: {
            type: type.STRING,
            allowNull: false
        },
        Variety: {
            type: type.STRING
        },
        DaysToMaturity: {
            type: type.STRING
        },
        Transplant: {
            type: type.BOOLEAN
        },
        DirectSeed: {
            type: type.BOOLEAN
        },
        MinDaysToGerminate: {
            type: type.INTEGER
        },
        MaxDaysToGerminate: {
            type: type.INTEGER
        },
        SeedsPer100Row: {
            type: type.INTEGER
        },
        SeedsPerAcre: {
            type: type.INTEGER
        },
        HarvestPer100Row: {
            type: type.INTEGER
        },
        Units: {
            type: type.STRING
        },
        SeedDepth: {
            type: type.INTEGER
        },
        PlantSpacing: {
            type: type.INTEGER
        },
        RowSpacing: {
            type: type.INTEGER
        },
        MinSoilTemperature: {
            type: type.INTEGER
        },
        MaxSoilTemperature: {
            type: type.INTEGER
        },
        MinIdealPh: {
            type: type.INTEGER
        },
        MaxIdealPh: {
            type: type.INTEGER
        },
    })

    return Crop;
};