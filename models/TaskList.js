module.exports = (sequelize, type) => {
    const TaskList = sequelize.define('tasklist', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ListName: {
            type: type.STRING
        },
        Description: {
            type: type.STRING,
        },
        Notes: {
            type: type.STRING,
        },
    })

    return TaskList;
};