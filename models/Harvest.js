module.exports = (sequelize, type) => {
    const Harvest = sequelize.define('harvest', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        HarvestDate: {
            type: type.DATE
        },
        Quantity: {
            type: type.FLOAT
        },
        Units: {
            type: type.STRING
        },
        CropAge: {
            type: type.INTEGER
        },
        HarvestedBy: {
            type: type.INTEGER
        },
        Quality: {
            type: type.INTEGER
        },
        Notes: {
            type: type.STRING,
        },
    })

    return Harvest;
};