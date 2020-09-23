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
        CropId: {
            type: type.INTEGER,
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

    return BedHistory;
};