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

var map_table = function(table) {
	var set = ['users', 'books', 'authors', 'categories', 'languages', 'reviews', 'favorites'];

	if (set.indexOf(table) > -1){
		//console.log('found');
		return table.charAt(0).toUpperCase() + table.slice(1);
	} else if (table === 'reviewcomments') {
		return 'ReviewComments';
	}
}


app = express();
app.use(bodyParser.json());

app.listen(8004);


app.route('/v1/:table')
	.get(function(req, res) {
		//connection.connect();
		var table = map_table(req.params.table);

		var limit = '';

		if (req.query.count) {
			limit  = ' LIMIT ' + req.query.count.toString();
		} else if (req.query.offset && req.query.limit){
			limit = ' LIMIT ' + req.query.offset.toString() + ',' + req.query.limit.toString();
		}

		connection.query('SELECT * from ' + table + limit, function(err, rows, fields) {
			console.log(req.params.table);

			if (err) {
				console.log('Error while performing query.');
				console.log(err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno
				});
			} else if (rows.length) {
				res.send(rows);
				//connection.end
			} else if (!rows.length) {
				console.log('There are no ' + req.params.table + ' on this database.');
				res.send({
					'message': 'There are no ' + req.params.table + ' on this database.'
				});
			}
		});
	})

	.post(function(req, res) {
		//connection.connect();

		var timestamp = {
			registrationDate: new Date()
		};

		connection.query('SELECT * from Users WHERE ?', {'username': req.body.username}, function(err, results) {
			if (err) {
				console.log('Error while performing query.');
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno
				});
			} else if (results.length) {
				res.send({
					'message': 'Username already taken.'
				}); 
			} else if (!results.length) {
				connection.query('INSERT INTO Users SET ?', merge(req.body, timestamp), function(err, results) {
					if (!err) {
						res.send({
							'message': 'success',
							'userId': results.insertId
						});
						//connection.end();
					} else {
						console.log('Error while performing query.');
						res.send({
							'message': 'There has been a problem with the server.',
							'errno': err.errno 
						});
					}
				});
			}
		});
	})

	.delete(function(req, res) {
		//connection.connect();

		var table = map_table(req.params.table);


		connection.query('TRUNCATE ' + table, function(err) {
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
					'errno': err.errno
				});
			}
		});
	});


app.route('/v1/users/:userId')
	.get(function(req, res) {
		//connection.connect();

		connection.query('SELECT * from Users WHERE ?', req.params, function(err, rows, fields) {
			if (rows.length) {
				res.send({
					'user': rows
				});
				//connection.end();
			} else if (!rows.length){
				console.log('There are no users with the requested userId.');
				res.send({
					'message': 'There are no users with the requested userId.'
				});
			} else if (err){
				console.log('Error while performing query.');
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno

				});
			}
		});
	})

	.put(function(req, res) {
		//connection.connect();

		connection.query('UPDATE Users SET ? WHERE ?', [req.body, req.params], function(err, results) {
			if (results.affectedRows) {
				connection.query('SELECT * from Users WHERE ?', req.params, function(err, rows) {
					if (!err) {
						res.send({
							'message': 'success',
							'user': rows
						});
						//connection.end();
					} else {
						console.log('Error while performing query.');
						res.send({
							'message': 'There has been a problem with the server.',
							'errno': err.errno
						});
					}
				});
			} else if (!results.affectedRows){
				console.log('There are no users with the requested userId.');
				res.send({
					'message': 'There are no users with the requested userId.'
				});
			} else if (err){
				console.log('Error while performing query.');
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno
				});
			}
		});
	})

	.delete(function(req, res) {
		//connection.connect();

		connection.query('DELETE FROM Users WHERE ?', req.params, function(err, results) {
			if (results.affectedRows) {

				console.log(results);
				res.send({
					'message': 'success'
				});
				//connection.end();
			} else if (!results.affectedRows) {
				console.log('There are no users with the requested userId.');
				res.send({
					'message': 'There are no users with the requested userId.'
				});
			} else if (err) {
				console.log('Error while performing query.');
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno
				});
			}
		});
	});


