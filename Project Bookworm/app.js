var express = require('express');
var bodyParser = require('body-parser')
var conf = require('./config');
var merge = require('merge');
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: conf.get('host'),
	user: conf.get('user'),
	password: conf.get('password'),
	database: conf.get('database')
});

app = express();
app.use(bodyParser.json());

app.listen(8004);

app.get('/v1/users', function(req, res) {
	connection.connect();

	connection.query('SELECT * from Users', function(err, rows, fields) {
		if (!err) {
			res.send(rows);
			connection.end();
		} else {
			console.log('Error while performing Query.');
		}
	});


});

app.post('/v1/users', function(req, res) {
	connection.connect();

	var timestamp = {
		registrationDate: new Date()
	};

	connection.query('SELECT * from Users WHERE username = ' + "'" + req.body.username + "'", function(err, results) {
		if (results.length > 0) {
			console.log('Username already taken!');
		} else {
			connection.query('INSERT INTO Users SET ?', merge(req.body, timestamp), function(err, result) {
				if (!err) {
					res.send('Query successful.');
					connection.end();
				} else {
					console.log('Error while performing Query.');
				}
			});
		}

	});

});