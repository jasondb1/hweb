const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_FILEPATH = './db/homeWeb.db';
const LOG_FILEPATH = 'current_log.csv';
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
        //this.connect();
        
        //console.log("insert data:");
        //console.log(data);

            
        this.db.run(`CREATE TABLE IF NOT EXISTS ${this.table} (` +
            "timestamp INTEGER," +
            "description TEXT," +
            "sensor TEXT," +
            "value TEXT," +
            "location TEXT" +
            ")");

        //let datetime = new Date();
        let datetime = Date.now();

        for (let row of data) {
            this.db.run('INSERT INTO ' + this.table + ' (timestamp, description, location, sensor, value) VALUES( ?, ?, ?, ?, ?)', [datetime, row.description, row.location, row.sensor, row.value],
                (err) => {
                    if (err) {
                        console.error(err);
                    }
                }
            );
        }

        //this.open();
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
    }

    clearLog(where = 1) {
        //let where = 1;

        this.db.run((`DELETE FROM sensor_data WHERE ?`), [where],
            (err) => {
                if (err) {
                    console.error(err);
                }
            }
        );
    }

    //retrieve sensor data
    //default time is 24 hours
    getSensorData(sensor, time_prev, callback) {

        //console.log("getSensorData");
        //this.connect();
        //let time_now = new Date().getTime;
        //let time_now = datetime.getTime();
        let time_threshold = Date.now() - time_prev;
        let rows = null;

        //TODO: limit, allow user to specify columns
        this.db.all(`SELECT * FROM ${this.table} WHERE sensor = ? AND timestamp > ?`, [sensor, time_threshold], function(err, rows) {
        // this.db.all(`SELECT * FROM ${this.table} WHERE sensor = ? AND timestamp > ?`, [sensor, time_prev], function(err, rows) {

            if (err) {
                // throw err;
                return callback(new Error("Error Retrieving Data"));
            }
            
            //console.log("database data:");
            //console.log(rows);
            return callback(null,rows);
        });

        //this.open();
        //return rows;

    }

    //export the data to a csv file
    exportData(filter = '1', filename = LOG_FILEPATH) {

        console.log("Exporting Data");
        //this.connect();
        let datetime = new Date();

        this.db.each(`SELECT * FROM ${this.table} WHERE ?`, [filter], function(err, row) {

            if (err) {
                throw err;
            }

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
                "\n",
                function(err) {}
            );
        });

        //this.open();

    }


}

module.exports = Database;
