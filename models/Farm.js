module.exports = (sequelize, type) => {
    const Farm = sequelize.define('farm', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        FarmName: {
            type: type.STRING,
            allowNull: false
        },
        Location: {
            type: type.STRING
        },
        CreatedDate: {
            type: type.DATE
        },
    })

    return Farm;
};