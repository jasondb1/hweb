module.exports = (sequelize, type) => {
    const SoldItems = sequelize.define('solditems', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        CropId: {
            type: type.INTEGER,
        },
        SaleId: {
            type: type.INTEGER
        },
        Status: {
            type: type.STRING
        },
        Quantity: {
            type: type.FLOAT,
        },
        Units: {
            type: type.STRING,
        },
        Notes: {
            type: type.STRING,
        },
    })

    return SoldItems;
};