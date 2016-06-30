var express = require('express');
var bodyParser = require('body-parser');
var merge = require('merge');
var mysql = require('mysql');
var http = require('http');
var jwt = require('jsonwebtoken');

var router = express.Router();

var conf = require('./config');

var connection = mysql.createConnection({
	host: conf.get('host'),
	user: conf.get('user'),
	password: conf.get('password'),
	database: conf.get('database')
});

router.post('/authenticate', function(req, res) {
	var params = {
		username: req.body.username
	};

	var secret = conf.get('secret');


	console.log(req.body);

	if (req.body.token) {
		jwt.verify(req.body.token, secret, function(err, decoded){

			if(!err){
				res.json({
					message:"Authenticated! Token accepted."
				});	
			} else {
				res.json({
					message: "Login failed. Please try again."
				});
			}
		});


	} else {
		connection.query('SELECT * from Users WHERE ?', params, function(err, results) {
			console.log(results);

			if (results.length > 0) {
				console.log('User found!');

				if (req.body.password === results[0].password) {
					console.log('User authenticated.');
					

					
					var json = {};

					merge(json, results[0]);

					var token = jwt.sign(json, secret, {
						expiresIn: "1 day"
					});

					res.json({
						message: "Authenticated! Token issued.",
						token: token
					});
					

				} else {
					console.log('Wrong password!');
					res.send({
						message: 'Wrong password!'
					});
				}

			} else {
				console.log('Username not found.');
				res.send({
					message: 'Username not found.'
				});
			}
		});
	}
});


router.route('/users')
	.get(function(req, res) {
		//connection.connect();



		var limit = '';

		// THIS IS BOUND FOR SQL INJECTION
		if (req.query.count) {
			limit = ' LIMIT ' + req.query.count.toString();
		} else if (req.query.offset && req.query.limit) {
			limit = ' LIMIT ' + req.query.offset.toString() + ',' + req.query.limit.toString();
		}

		connection.query('SELECT * from Users ' + limit, function(err, results) {

			if (err) {
				console.log('Error while performing query.');
				console.log(err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno,
					'err': err
				});
			} else if (results.length) {
				var json = {};
				json.users = results;

				res.send(json);
				//connection.end
			} else if (!results.length) {
				console.log('There are no users on this database.');
				res.send({
					'message': 'There are no users on this database.'
				});
			}
		});
	})

.post(function(req, res) {
	//connection.connect();

	console.log(req.body);

	connection.query('SELECT * from Users WHERE username = ?', [req.body.username], function(err, rows, fields) {
		if (err) {
			console.log('Error while performing query.');
			console.log(err);
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': err.errno,
				'err': err
			});
		} else if (rows.length) {

			console.log(fields);



			res.send({
				'message': 'User already exists.',
				'id': rows[0][fields[0].name]
			});
		} else if (!rows.length) {
			var regDate = {
				// USER MYSQL TIMESTAMP with NOW() as default instead
				registrationDate: new Date()
			};

			merge(req.body, regDate);



			connection.query('INSERT INTO Users SET ?', req.body, function(err, results) {

				if (!err) {
					res.send({
						'message': 'success',
						'id': results.insertId
					});
					//connection.end();
				} else {
					console.log('Error while performing query.');
					console.log(err);

					res.send({
						'message': 'There has been a problem with the server.',
						'errno': err.errno,
						'err': err
					});
				}
			});
		}
	});
})

// SUPPORT DELETE BY ID INSTEAD
.delete(function(req, res) {
	//connection.connect();

	connection.query('TRUNCATE Users', function(err) {
		if (!err) {
			res.send({
				'message': 'success'
			});
			//connection.end();
		} else {
			console.log(err);
			console.log('Error while performing query.');
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': err.errno,
				'err': err
			});
		}
	});
});


router.route('/v1/users/search')
	.get(function(req, res) {
		params = {
			username: req.query.username
		};

		console.log(params);
		connection.query('SELECT * from Users WHERE ' + params, function(err, rows, fields) {
			if (err) {
				console.log('Error while performing query.');
				console.log(err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno,
					'err': err
				});
			} else if (rows.length) {
				res.send(rows);

			} else if (!rows.length) {
				console.log('There are no users with the requested username.');
				res.send({
					'message': 'There are no users with the requested username.'
				});
			}

		});


	});



router.route('/v1/users/:id')
	.get(function(req, res) {
		//connection.connect();

		var id = {
			userId: req.params.id
		}

		connection.query('SELECT * from Users WHERE ?', id, function(err, rows, fields) {
			if (err) {
				console.log('Error while performing query.');
				console.log(err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno,
					'err': err

				});
			} else if (rows.length) {
				var json = {};

				if (req.query.fields != undefined) {
					var columns = req.query.fields.split(',');

					columns.forEach(function(item, index) {
						var data = {};

						data[item] = rows[0][item];

						merge(json.user, data);

					});
				} else {

					json.user = rows;

				}


				res.send(json);
				//connection.end();

			} else if (!rows.length) {
				console.log('There are no users with the requested id.');
				res.send({
					'message': 'There are no users with the requested id.'
				});
			}
		});
	})

.put(function(req, res) {
	//connection.connect();

	var id = {
		userId: req.params.id
	}

	connection.query('UPDATE Users SET ? WHERE ?', [req.body, id], function(err, results) {
		if (err) {
			console.log('Error while performing query.');
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': err.errno,
				'err': err
			});
		}
		if (results.affectedRows) {
			connection.query('SELECT * from Users WHERE ?', id, function(err, rows) {
				if (!err) {
					var json = {};
					json.user = rows;


					var msg = {
						'message': 'success'
					};
					res.send(merge(msg, json));
					//connection.end();
				} else {
					console.log('Error while performing query.');
					res.send({
						'message': 'There has been a problem with the server.',
						'errno': err.errno,
						'err': err
					});
				}
			});
		} else if (!results.affectedRows) {
			console.log('There are no users with the requested id.');
			res.send({
				'message': 'There are no users with the requested id.'
			});
		}
	});
})

.delete(function(req, res) {
	//connection.connect();

	var id = {
		userId: req.params.id
	}

	connection.query('DELETE FROM Users WHERE ?', id, function(err, results) {
		if (err) {
			console.log('Error while performing query.');
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': err.errno,
				'err': err
			});
		}
		if (results.affectedRows) {

			console.log(results);
			res.send({
				'message': 'success'
			});
			//connection.end();
		} else if (!results.affectedRows) {
			console.log('There are no users with the requested id.');
			res.send({
				'message': 'There are no users with the requested id.'
			});
		}
	});
});


module.exports = router;
