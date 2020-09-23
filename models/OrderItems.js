module.exports = (sequelize, type) => {
    const OrderItems = sequelize.define('orderitems', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        CropId: {
            type: type.INTEGER,
        },
        OrderId: {
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

    return OrderItems;
};