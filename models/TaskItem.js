module.exports = (sequelize, type) => {
    const TaskItem = sequelize.define('taskitem', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Subject: {
            type: type.STRING,
        },
        Description: {
            type: type.STRING,
        },
        Assigned: {
            type: type.INTEGER,
        },
        Status: {
            type: type.STRING,
        },
        DateEntered: {
            type: type.DATE,
        },
        DueDate: {
            type: type.DATE,
        },
        Notes: {
            type: type.STRING,
        },
        // AssociatedBed: {
        //     type: type.INTEGER,
        // },

    })

    return TaskItem;
};