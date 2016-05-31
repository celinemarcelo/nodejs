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


app.route('/v1/users')
	.get(function(req, res) {
		//connection.connect();

		connection.query('SELECT * from Users', function(err, rows, fields) {
			if (!err) {
				res.send({
					"users": rows
				});
				//connection.end();
			} else {
				console.log('Error while performing query.');
				res.send('There has been a problem with the server.');
			}
		});
	})

	.post(function(req, res) {
		//connection.connect();

		var timestamp = {
			registrationDate: new Date()
		};

		connection.query('SELECT * from Users WHERE username = ' + "'" + req.body.username + "'", function(err, results) {
			if (results.length > 0) {
				res.send({
					"message": "Username already taken."
				});
			} else {
				connection.query('INSERT INTO Users SET ?', merge(req.body, timestamp), function(err, results) {
					if (!err) {
						res.send({
							"message": "success",
							"userId": results.insertId
						});
						//connection.end();
					} else {
						console.log('Error while performing query.');
						res.send('There has been a problem with the server.');
					}
				});
			}

		});

	})

	.put(function(req, res) {
		//connection.connect();

		connection.query('TRUNCATE Users', function(err) {
			if (!err) {
				res.send({
					"message": "success"
				});
				//connection.end();
			} else {
				console.log('Error while performing query.');
				res.send('There has been a problem with the server.');
			}
		});
	})

	.delete(function(req, res) {
		//connection.connect();

		connection.query('TRUNCATE Users', function(err) {
			if (!err) {
				res.send({
					"message": "success"
				});
				//connection.end();
			} else {
				console.log('Error while performing query.');
				res.send('There has been a problem with the server.');
			}
		});
	});



app.get('/v1/users/:userId', function(req, res) {
	//connection.connect();

	connection.query('SELECT * from Users WHERE userId = ' + req.params.userId, function(err, rows, fields) {
		if (!err) {
			console.log(req.params.userId);

			res.send({
				"user": rows
			});
			//connection.end();
		} else {
			console.log('Error while performing query.');
			res.send('There has been a problem with the server.');
		}
	});
});	