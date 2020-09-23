const DEBUG = false;
const fs = require('fs');
const LOG_FILEPATH = 'current_log.csv'; //move this to a config file
let table = 'sensor_data';
const { OP } = require('sequelize');

class Database {

  constructor(db) {
    this.db = db;
    this.table = table;
  }

  //Generic Error Handler 
  errHandler = err => {
    //Catch and log any error.
    console.error("Error: ", err);
  };

  insert(data) {

    if (DEBUG) {
      console.log("insert data:");
      console.log(data);
    }
    //verification if needed

    let datetime = Date.now();

    for (let row of data) {

      this.db.Sensor.create({
        Timestamp: datetime,
        //Description: row.description,
        Location: row.location,
        Sensor: row.sensor,
        Value: row.value,
      })
        //.then(console.log("entry created"))
        .catch(this.errHandler)
    }
  }

  reset(sensor) {
    //this.connect();

    let where;
    if (sensor === 'all') {

      //reset all (be very careful) consider removing
      this.db.Sensor.destroy({
        truncate: true
      }).catch(this.errHandler);
    } else {
      this.db.Sensor.destroy({
        where: {
          Sensor: sensor
        }
      }).catch(this.errHandler);;
    }
  }

  clearLog(where) {

    if (where != null) {
      this.db.Sensor.destroy({
        truncate: true
      }).catch(this.errHandler);
    } else {
      this.db.Sensor.destroy({
        where: { where }
      }).catch(this.errHandler);
    }
  }

  //retrieve sensor data
  //default time is 24 hours
  getSensorData(sensor, time_prev, callback) {
    let values = null;

    values = this.db.Sensor.findAll({
      attributes: ['Timestamp', 'Value'],
      where: {
        Sensor: sensor,
        Timestamp: {
          [this.db.Sequelize.Op.gt]: new Date(new Date() - time_prev)
        }
      }
    })
      .then((values) => {
        if ((values) === null) {
          // throw err;
          return callback(new Error("Error Retrieving Data"));
        }

        if (DEBUG) {
          console.log("[getSensorData]");
          console.log("database data:");
          console.log(values);
        }

        return callback(null, values);

      })
      .catch(this.errHandler)

  };

  //export the data to a csv file
  exportData(filter = '1', filename = LOG_FILEPATH) {

    console.log("Exporting Data");

    let datetime = new Date();

    const values = this.db.Sensor.findAll()
      .then(
        fs.appendFile(
          filename,
          values.timestamp +
          "," +
          values.description +
          "," +
          values.location +
          "," +
          values.sensor +
          "," +
          values.value +
          "\n",
          function (err) { }
        )
      );

  }
}

module.exports = Database;
