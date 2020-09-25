module.exports = (sequelize, type) => {
    const Nursery = sequelize.define('nursery', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        PlantedDate: {
            type: type.DATE
        },
        Location: {
            type: type.STRING
        },
        NumberOfPlants: {
            type: type.INTEGER,
        },
        EarliestTransplantDate: {
            type: type.DATE,
        },
        LatestTransplantDate: {
            type: type.DATE,
        },
        SeededBy: {
            type: type.INTEGER,
        },
        Notes: {
            type: type.STRING,
        },
    })

    return Nursery;
};