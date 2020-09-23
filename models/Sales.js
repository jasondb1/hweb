module.exports = (sequelize, type) => {
    const Sale = sequelize.define('sale', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        CropId: {
            type: type.INTEGER,
        },
        Customer: {
            type: type.STRING
        },
        CustomerID: {
            type: type.INTEGER,
        },
        SaleDate: {
            type: type.DATE
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

    return Sale;
};