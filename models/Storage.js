module.exports = (sequelize, type) => {
    const Storage = sequelize.define('storage', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        CropId: {
            type: type.INTEGER,
        },
        Location: {
            type: type.STRING
        },
        StoreDate: {
            type: type.DATE
        },
        Quantity: {
            type: type.INTEGER
        },
        Units: {
            type: type.STRING,
        },
        Notes: {
            type: type.STRING,
        },
    })

    return Storage;
};