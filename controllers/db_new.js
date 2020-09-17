const fs = require('fs');
const LOG_FILEPATH = 'current_log.csv'; //move this to a config file
let table = 'sensor_data';

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

    console.log("insert data:");
    console.log(data);

    //verification if needed

    let datetime = Date.now();

    for (let row of data) {

      this.db.sensor.create({
        Timestamp: datetime,
        //Description: row.description,
        Location: row.location,
        Sensor: row.sensor,
        Value: row.value,
      })
        .then(console.log("entry created"))
        .catch(errHandler)
    }
  }

  reset(sensor) {
    //this.connect();

    let where;
    if (sensor === 'all') {

      //reset all (be very careful) consider removing
      this.db.sensor.destroy({
        truncate: true
      }).catch(errHandler);
    } else {
      this.db.sensor.destroy({
        where: {
          Sensor: sensor
        }
      }).catch(errHandler);
    }
  }

  clearLog(where) {

    if (where != null) {
      this.db.sensor.destroy({
        truncate: true
      }).catch(errHandler);
    } else {
      this.db.sensor.destroy({
        where: { where }
      }).catch(errHandler);
    }
  }

  //retrieve sensor data
  //default time is 24 hours
  getSensorData(sensor, time_prev, callback) {

    //console.log("getSensorData");
    //this.connect();
    //let time_now = new Date().getTime;
    //let time_now = datetime.getTime();
    let time_threshold = Date.now() - time_prev;
    let values = null;

    const values = this.db.sensor.findAll({
      where: {
        Sensor: sensor,
        timestamp: { [Op.gt]: time_threshold }
      }
    }).catch(errHandler)

    if (values === null) {
      // throw err;
      return callback(new Error("Error Retrieving Data"));
    }

    if (DEBUG) {
      console.log("database data:");
      console.log(values);
    }
    return callback(null, values);
  };

  //export the data to a csv file
  exportData(filter = '1', filename = LOG_FILEPATH) {

    console.log("Exporting Data");

    let datetime = new Date();

    const values = this.db.sensor.findAll()
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
