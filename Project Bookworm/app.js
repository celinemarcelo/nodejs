var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
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

var build_body = function(req) {
	var set = ['books', 'authors', 'categories', 'languages', 'reviews'];

	var timestamp = {
		'timestamp': new Date()
	};

	var registrationDate = {
		'registrationDate': new Date()		
	};

	if (set.indexOf(req.params.table) > -1){
		return req.body;
	} else if (req.params.table === 'favorites' || req.params.table === 'reviewcomments') {
		return merge(req.body, timestamp);
	} else if (req.params.table === 'users') {
		return merge(req.body, registrationDate);
	}
}

var build_args = function(req) {
	var t = req.params.table

	switch(t) {
		case 'users':
			return {'username': req.body.username};
			break;
		case 'books':
			return {'title': req.body.title, 'author': req.body.author};
			break;
		case 'authors':
			return {'firstName': req.body.firstName, 'lastName': req.body.lastName};
			break;
		case 'categories':
			return {'categoryName': req.body.categoryName};
			break;
		case 'languages':
			return {'language': req.body.language};
			break;
		case 'favorites':
			return {'user': req.body.user, 'book': req.body.book};
	}
}

var build_id = function(req) {
	var t = req.params.table

	switch (t) {
		case 'users':
			return {'userId': req.params.id};
			break;
		case 'books':
			return {'bookId': req.params.id};
			break;
		case 'authors':
			return {'authorId': req.params.id};
			break;
		case 'favorites':
			return {'favoriteId': req.params.id};
			break;
		case 'categories':
			return {'categoryId': req.params.id};
			break;
		case 'languages':
			return {'languageId': req.params.id};
			break;
		case 'reviewcomments':
			return {'reviewCommentId': req.params.id};
			break;
		case 'reviews':
			return {'reviewId': req.params.id};
			break;
	}
}


var app = express();
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

		connection.query('SELECT * from ' + table + limit, function(err, results) {
			console.log(req.params.table);

			if (err) {
				console.log('Error while performing query.');
				console.log(err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno
				});
			} else if (results.length) {
				var json = {};
				json[req.params.table] = results;

				res.send(json);
				//connection.end
			} else if (!results.length) {
				console.log('There are no ' + req.params.table + ' on this database.');
				res.send({
					'message': 'There are no ' + req.params.table + ' on this database.'
				});
			}
		});
	})

	.post(function(req, res) {
		//connection.connect();

		var table = map_table(req.params.table);
		var body = build_body(req);
		var args = build_args(req);

		console.log(body);


		connection.query('SELECT * from ' + table + ' WHERE ?', args, function(err, results) {
			if (err) {
				console.log('Error while performing query.');
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno
				});
			} else if (results.length) {
				var msg;

				if (table === 'Categories') {
					msg = 'Category';
				} else {
					msg = table.slice(0, table.length - 1);
				}

				res.send({
					'message':  msg + ' already exists.'
				}); 
			} else if (!results.length) {
				connection.query('INSERT INTO ' + table + ' SET ?', body, function(err, results) {

					if (!err) {
						res.send({
							'message': 'success',
							'id': results.insertId
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


app.route('/v1/:table/:id')
	.get(function(req, res) {
		//connection.connect();

		var table = map_table(req.params.table);
		var id = build_id(req);
		

		connection.query('SELECT * from ' + table + ' WHERE ?', id, function(err, rows, fields) {
			 if (err){
				console.log('Error while performing query.');
				console.log(err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno

				});
			} else if (rows.length) {
				var json = {};

				if (req.query.fields != undefined) {
					var columns = req.query.fields.split(',');

					columns.forEach(function(item, index) {
						var data = {};

						data[item] = rows[0][item];

						if (table === 'Categories') {
							json['category'] = merge(json.category, data);
						} else {
							json[req.params.table.slice(0, table.length - 1)] = merge(json[req.params.table.slice(0, table.length - 1)], data);
						}

					});
				} else if (table === 'Categories') {
					json['category'] = rows;
				} else {

					json[req.params.table.slice(0, table.length - 1)] = rows;

				}


				res.send(json);
				//connection.end();

			} else if (!rows.length){
				console.log('There are no ' + req.params.table + ' with the requested id.');
				res.send({
					'message': 'There are no ' + req.params.table + ' with the requested id.'
				});
			}
		});
	})

	.put(function(req, res) {
		//connection.connect();

		var table = map_table(req.params.table);
		var id = build_id(req);


		connection.query('UPDATE ' + table + ' SET ? WHERE ?', [req.body, id], function(err, results) {
			if (err){
				console.log('Error while performing query.');
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno
				});
			} if (results.affectedRows) {
				connection.query('SELECT * from ' + table + ' WHERE ?', id, function(err, rows) {
					if (!err) {
						var json = {};
						if (table === 'Categories') {
							json['category'] = rows;
						} else {
							json[req.params.table.slice(0, table.length - 1)] = rows;
						}


						var msg = {'message': 'success'};
						res.send(merge(msg, json));
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
				console.log('There are no ' + req.params.table + ' with the requested id.');
				res.send({
					'message': 'There are no ' + req.params.table + ' with the requested id.'
				});
			}
		});
	})

	.delete(function(req, res) {
		//connection.connect();

		var table = map_table(req.params.table);
		var id = build_id(req);


		connection.query('DELETE FROM ' + table + ' WHERE ?', id, function(err, results) {
			if (err) {
				console.log('Error while performing query.');
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': err.errno
				});
			} if (results.affectedRows) {

				console.log(results);
				res.send({
					'message': 'success'
				});
				//connection.end();
			} else if (!results.affectedRows) {
				console.log('There are no ' + req.params.table + ' with the requested id.');
				res.send({
					'message': 'There are no ' + req.params.table + ' with the requested id.'
				});
			}
		});
	});