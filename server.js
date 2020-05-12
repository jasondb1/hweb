if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const app = express();
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/react-express-jwt';
const PORT = process.env.PORT || 3001;
const fs = require('fs');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const componentsio = require('./routes/componentsio.js')(io);

const components = require('./routes/components');
const usersRoutes = require('./routes/users.js');

const https = require('https');

//const secureserver = require('https').Server(app);
//const https = require('https').Server(app);
const sslOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    passphrase: 'mysslcert'
};

app.use(cors());


//connect to database
mongoose.set('useCreateIndex', true);
mongoose.connect(MONGODB_URI, {useNewUrlParser: true}, (err) => {
    console.log(err || `Connected to MongoDB.`)
});


//middleware

//attach socket io instance to req
//use it in routes with req.io.emit
app.use(function(req,res,next){
    req.io = io;
    //console.log(req.io);
    next();
});

app.use(express.static(`${__dirname}/client/build`));
app.use(logger('dev'));
app.use(bodyParser.json());


//routes
app.get('/api', (req, res) => {
    res.json({message: "API root."})
});

app.use('/api/users', usersRoutes);
app.use('/api', components);

app.use('*', (req, res) => {
    res.sendFile(`${__dirname}/client/build/index.html`)
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//TODO: Include better error handler?

//Start server
//app.listen(PORT, (err) => {
server.listen(PORT, (err) => {
    console.log(err || `Server running on port ${PORT}.`)
});

//create https server
https.createServer(sslOptions, app).listen(8443);


