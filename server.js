var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var apiRoutes = require('./app/routes/api')(app, express);
var customerapi = require('./app/routes/customerapi')(app, express);
var employeeapi = require('./app/routes/employeeapi')(app, express);
var lookuptypeapi = require('./app/routes/lookuptypeapi')(app, express);
var lookupapi = require('./app/routes/lookupapi')(app, express);

var path = require('path');
var mongoose = require('mongoose');

var morgan = require('morgan');

var config = require('./config');

console.log(config.database);

mongoose.connect(config.database);

var database = mongoose.connection;
database.on('error', console.error.bind(console, 'connection error:'));
database.once('open', function() {
    console.log('Database connection established successfully');
});

var appInitializer = require('./app/init');

appInitializer.init();

app.use(express.static(__dirname + '/public'));

app.use(morgan('dev'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(function(req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'x-access-token,X-Requested-With,content-type,Authorization,Origin,Accept');

    next();
});

app.use('/api/customer', customerapi);
app.use('/api', apiRoutes);
app.use('/api/serviceprovider/lookup', lookupapi);
app.use('/api/serviceprovider/', employeeapi);
app.use('/api/lookuptype', lookuptypeapi);
app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

app.listen(config.port);
console.log('Magic happens on port ' + config.port);