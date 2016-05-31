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

		var limit = '';

		if (req.query.count != undefined) {
			limit  = ' LIMIT ' + req.query.count.toString();
		} else if (req.query.offset != undefined && req.query.limit != undefined){
			limit = ' LIMIT ' + req.query.offset.toString() + ',' + req.query.limit.toString();
		}

		connection.query('SELECT * from Users' + limit, function(err, rows, fields) {
			if (rows.length) {
				res.send({
					"users": rows
				});
				//connection.end();
			} else if (!rows.length){
				console.log('There are no registered users.');
				res.send({
					"message": "There are no registered users."
				});
			} else if (err){
				console.log('Error while performing query.');
				res.send({
					"message": "There has been a problem with the server."
				});
			}
		});
	})

	.post(function(req, res) {
		//connection.connect();

		var timestamp = {
			registrationDate: new Date()
		};

		connection.query('SELECT * from Users WHERE username = ' + "'" + req.body.username + "'", function(err, results) {
			if (results.length) {
				res.send({
					"message": "Username already taken."
				});
			} else if (!results.length) {
				connection.query('INSERT INTO Users SET ?', merge(req.body, timestamp), function(err, results) {
					if (!err) {
						res.send({
							"message": "success",
							"userId": results.insertId
						});
						//connection.end();
					} else {
						console.log('Error while performing query.');
						res.send({
							"message": "There has been a problem with the server."
						});
					}
				});
			} else if (err) {
				console.log('Error while performing query.');
				res.send({
					"message": "There has been a problem with the server."
				});
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
				res.send({
					"message": "There has been a problem with the server."
				});
			}
		});
	});


app.route('/v1/users/:userId')
	.get(function(req, res) {
		//connection.connect();

		connection.query('SELECT * from Users WHERE userId = ' + req.params.userId, function(err, rows, fields) {
			if (rows.length) {
				res.send({
					"user": rows
				});
				//connection.end();
			} else if (!rows.length){
				console.log('There are no users with the requested userId.');
				res.send({
					"message": "There are no users with the requested userId."
				});
			} else if (err){
				console.log('Error while performing query.');
				res.send({
					"message": "There has been a problem with the server."
				});
			}
		});
	})

	.put(function(req, res) {
		//connection.connect();

		connection.query('UPDATE Users SET ? WHERE userId = ' + req.params.userId, req.body, function(err, results) {
			if (results.affectedRows) {
				connection.query('SELECT * from Users WHERE userId = ' + req.params.userId, function(err, rows) {
					if (!err) {
						res.send({
							"message": "success",
							"user": rows
						});
						//connection.end();
					} else {
						console.log('Error while performing query.');
						res.send({
							"message": "There has been a problem with the server."
						});
					}
				});
			} else if (!results.affectedRows){
				console.log('There are no users with the requested userId.');
				res.send({
					"message": "There are no users with the requested userId."
				});
			} else if (err){
				console.log('Error while performing query.');
				res.send({
					"message": "There has been a problem with the server."
				});
			}
		});
	})

	.delete(function(req, res) {
		//connection.connect();

		connection.query('DELETE FROM Users WHERE userId = ' + req.params.userId, function(err) {
			if (!err) {
				res.send({
					"message": "success"
				});
				//connection.end();
			} else {
				console.log('Error while performing query.');
				res.send({
					"message": "There has been a problem with the server."
				});
			}
		});
	});