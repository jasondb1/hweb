module.exports = (sequelize, type) => {
    const Orders = sequelize.define('orders', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Customer: {
            type: type.STRING
        },
        OrderDate: {
            type: type.DATE
        },
        RequiredDate: {
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

    return Orders;
};