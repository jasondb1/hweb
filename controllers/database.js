const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_FILEPATH = './db/homeWeb.db';
const LOG_FILEPATH = 'log.csv';
let table = 'sensor_data';

class Database {

    constructor() {
        //this.db = null;
        this.table = table;

        this.db = new sqlite3.Database(DB_FILEPATH, (err) => {
            if (err) {
                console.error("[components.js] " + err.message);
            } else {
                console.log('Connected to the homeWeb database.');
            }
        });
    }

    connect() {
        this.db = new sqlite3.Database(DB_FILEPATH, (err) => {
            if (err) {
                console.error("[components.js] " + err.message);
            } else {
                console.log('Connected to the homeWeb database.');
            }
        });

    }

    close() {
        this.db.close((err) => {
            if (err) {
                return console.error(err.message);
            } else {
                console.log('Close the db connection');
            }
        });
    }

    insert(data) {
console.log('insert data');
        //this.connect();

        this.db.run(`CREATE TABLE IF NOT EXISTS ${this.table} (` +
            "timestamp INTEGER," +
            "description TEXT," +
            "sensor TEXT," +
            "value TEXT," +
            "location TEXT" +
            ")");

        let datetime = new Date();

        for (let row of data) {
            this.db.run('INSERT INTO '+ this.table +' (timestamp, description, location, sensor, value) VALUES( ?, ?, ?, ?, ?)',
                [datetime.getTime(), row.description, row.location, row.sensor, row.value],
                (err) => {
                    if (err) {
                        console.error(err);
                    }
                }
            );
        }

        //this.close();
    }


    reset(sensor) {
        //this.connect();

        let where;
        if (sensor === 'all') {
            where = '1'; //reset all
        } else {
            where = 'sensor = ' + sensor;
        }

        this.db.run((`DELETE FROM sensor_data WHERE ?`), [where],
            (err) => {
                if (err) {
                    console.error(err);
                }
            }
        );

        //this.close();

    }

    getSensorData(sensor, time_prev = ( 24 * 60 * 60 * 1000)) {

        //this.connect();
        //let datetime = new Date();
        //let time_now = datetime.getTime();
        //let time = time_now - time_prev;
        let rows = null;

        //TODO: limit, allow user to specify columns
        this.db.all(`SELECT * FROM ${this.table} WHERE sensor = ? AND timestamp > ?`, [sensor, time_prev], function (err, rows) {

            if (err) {
                throw err;
            }

            //console.log(rows);

        });

        //this.close();
        return rows;

    }

    exportData(filter = '1', filename = LOG_FILEPATH) {

        //this.connect();
        let datetime = new Date();

        this.db.each(`SELECT * FROM ${this.table} WHERE ?`, [filter], function (err, row) {

            if (err) {
                throw err;
            }

            //rows.forEach(function (row) {
            //console.log(row.id + ": " + row.info);
            console.log(row);

            fs.appendFile(
                filename,
                row.timestamp +
                "," +
                row.description +
                "," +
                row.location +
                "," +
                row.sensor +
                "," +
                row.value +
                "\n", function (err) {
                }
            );
            //});
        });

        //this.close();

    }


}

module.exports = Database;

