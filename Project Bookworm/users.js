var express = require('express');
var bodyParser = require('body-parser');
var merge = require('merge');
var mysql = require('mysql');
var http = require('http');
var jwt = require('jsonwebtoken');


var router = express.Router();

var conf = require('./config');

//err codes
//0 - no records on database
//-1 - already exists
//-2 - record not found
//-3 - wrong password
//-4 - token not accepted
//-5 - db error
//-6 - upload error



router.post('/authenticate', function(req, res) {
	var params = {
		username: req.body.username
	};

	var secret = conf.get('secret');


	console.log(req.body);
	console.log(params);

	if (req.body.token) {
		jwt.verify(req.body.token, secret, function(err, decoded){

			if(!err){
				res.json({
					message: "Authenticated! Token accepted."
				});	
			} else {
				res.json({
					message: "Login failed. Please try again.",
					errno: -4
				});
			}
		});


	} else {
		req.app.settings.connection.query('SELECT * from Users WHERE ?', params, function(err, results) {
			console.log(results);

			if (err) {
				console.log(err);
			} else if (results.length > 0) {
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
					console.log('Wrong username/password!');
					res.send({
						message: 'Wrong username/password!',
						errno: -3
					});
				}

			} else {
				console.log('Wrong username/password!');
				res.send({
					message: 'Wrong username/password!',
					errno: -2
				});
			}
		});
	}
});


router.route('/users')
	.get(function(req, res) {
		//req.app.settings.connection.connect();


		var cb = function(err, rows, fields) {

			if (err) {
				console.log('Error while performing query.');
				console.log(err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': -5
				});
			} else if (rows.length) {
				if(req.query.fields != undefined){
					var jsonArr = [];
					var json = {};
					var data = {};


					var columns = req.query.fields.split(',');

					rows.forEach(function(item, outerIndex) {
						columns.forEach(function(field, innerIndex){

							data[field] = rows[outerIndex][field];
							merge(json, data);
						});

						jsonArr.push(json);
						json = {};

					});
					data = {};

					data.users = jsonArr;
					res.send(data);


				} else {
					var json = {};
					json.users = rows;

					res.send(json);

				}


				
				//req.app.settings.connection.end
			} else if (!rows.length) {
				console.log('There are no users on this database.');
				res.send({
					message: 'There are no users on this database.',
					errno: 0 
				});
			}
		}



		if (req.query.count) {
			req.app.settings.connection.query('SELECT * from Users LIMIT ?', [parseInt(req.query.count)], cb);
		} else if (req.query.offset && req.query.limit){
			req.app.settings.connection.query('SELECT * from Users LIMIT ?,?', [parseInt(req.query.offset), parseInt(req.query.limit)], cb);
		} else {

			req.app.settings.connection.query('SELECT * from Users', cb);
		}
	})

.post(function(req, res) {
	//req.app.settings.connection.connect();

	console.log(req.body);

	req.app.settings.connection.query('SELECT * from Users WHERE username = ?', [req.body.username], function(err, rows, fields) {
		if (err) {
			console.log('Error while performing query.');
			console.log(err);
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (rows.length) {

			console.log(fields);



			res.send({
				'message': 'User already exists.',
				'id': rows[0][fields[0].name],
				errno: -1
			});
		} else if (!rows.length) {
			var regDate = {
				registrationDate: new Date()
			};

			merge(req.body, regDate);



			req.app.settings.connection.query('INSERT INTO Users SET ?', req.body, function(err, results) {

				if (!err) {
					res.send({
						'message': 'success',
						'id': results.insertId
					});
					//req.app.settings.connection.end();
				} else {
					console.log('Error while performing query.');
					console.log(err);

					res.send({
						'message': 'There has been a problem with the server.',
						'errno': -5
					});
				}
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
		req.app.settings.connection.query('SELECT * from Users WHERE ?', params, function(err, rows, fields) {
			if (err) {
				console.log('Error while performing query.');
				console.log(err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': -5
				});
			} else if (rows.length) {
				res.send(rows);

			} else if (!rows.length) {
				console.log('There are no users with the requested username.');
				res.send({
					'message': 'There are no users with the requested username.',
					errno: -2
				});
			}

		});


	});



router.route('/v1/users/:id')
	.get(function(req, res) {
		//req.app.settings.connection.connect();

		var id = {
			userId: req.params.id
		}

		req.app.settings.connection.query('SELECT * from Users WHERE ?', id, function(err, rows, fields) {
			if (err) {
				console.log('Error while performing query.');
				console.log(err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': -5

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
				//req.app.settings.connection.end();

			} else if (!rows.length) {
				console.log('There are no users with the requested id.');
				res.send({
					'message': 'There are no users with the requested id.',
					errno: -2
				});
			}
		});
	})

.put(function(req, res) {
	//req.app.settings.connection.connect();

	var id = {
		userId: req.params.id
	}

	req.app.settings.connection.query('UPDATE Users SET ? WHERE ?', [req.body, id], function(err, results) {
		if (err) {
			console.log('Error while performing query.');
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		}
		if (results.affectedRows) {
			req.app.settings.connection.query('SELECT * from Users WHERE ?', id, function(err, rows) {
				if (!err) {
					var json = {};
					json.user = rows;


					var msg = {
						'message': 'success'
					};
					res.send(merge(msg, json));
					//req.app.settings.connection.end();
				} else {
					console.log('Error while performing query.');
					res.send({
						'message': 'There has been a problem with the server.',
						'errno': -5
					});
				}
			});
		} else if (!results.affectedRows) {
			console.log('There are no users with the requested id.');
			res.send({
				'message': 'There are no users with the requested id.',
				errno: -2
			});
		}
	});
})

.delete(function(req, res) {
	//req.app.settings.connection.connect();

	var id = {
		userId: req.params.id
	}

	req.app.settings.connection.query('DELETE FROM Users WHERE ?', id, function(err, results) {
		if (err) {
			console.log('Error while performing query.');
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		}
		if (results.affectedRows) {

			console.log(results);
			res.send({
				'message': 'success'
			});
			//req.app.settings.connection.end();
		} else if (!results.affectedRows) {
			console.log('There are no users with the requested id.');
			res.send({
				'message': 'There are no users with the requested id.',
				errno: -2
			});
		}
	});
});


module.exports = router;