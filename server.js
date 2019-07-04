const	dotenv = require('dotenv').load();
const	express = require('express');
const	app = express();
const	logger = require('morgan');
const	bodyParser = require('body-parser');
const	mongoose = require('mongoose');
const	MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/react-express-jwt';
const	PORT = process.env.PORT || 3001;

const components = require('./routes/components');
const	usersRoutes = require('./routes/users.js');


//connect to database
mongoose.set('useCreateIndex', true);
mongoose.connect(MONGODB_URI, { useNewUrlParser: true }, (err) => {
	console.log(err || `Connected to MongoDB.`)
});

//middleware
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
app.listen(PORT, (err) => {
	console.log(err || `Server running on port ${PORT}.`)
});
