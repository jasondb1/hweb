module.exports = (sequelize, type) => {
    const Customer = sequelize.define('customer', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Name: {
            type: type.STRING
        },
        CreatedDate: {
            type: type.DATE
        },
        Status: {
            type: type.STRING
        },
        Email: {
            type: type.STRING
        },
        Phone: {
            type: type.STRING,
        },
        Street: {
            type: type.STRING
        },
        City: {
            type: type.STRING
        },
        Province: {
            type: type.STRING
        },
        Postal: {
            type: type.STRING
        },

        Notes: {
            type: type.STRING,
        },
    })

    return Customer;
};