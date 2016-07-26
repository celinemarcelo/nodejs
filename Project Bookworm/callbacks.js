var multer = require('multer');
var s3 = require('multer-storage-s3');
var merge = require('merge');
var winston = require('winston');
var jwt = require('jsonwebtoken');
var paginate = require('node-paginate-anything');
var async = require('async');


var helpers = require('./helpers');
var dbConnect = require('./dbConnect');
var conf = require('./config');

var connection = dbConnect();


winston.add(winston.transports.File, {
	filename: './pb.log',
	level: 'info',
	name: 'pb-logs'
});

var build_args = function(req) {
	var t = req.params.table

	switch (t) {
		case 'users':
			return "username = " + connection.escape(req.body.username);
			break;
		case 'books':
			return "title = " + connection.escape(req.body.title) + " AND author = " + connection.escape(req.body.author);
			break;
		case 'authors':
			return "firstName = " + connection.escape(req.body.firstName) + " AND lastName = " + connection.escape(req.body.lastName);
			break;
		case 'categories':
			return "categoryName = " + connection.escape(req.body.categoryName);
			break;
		case 'languages':
			return "language = " + connection.escape(req.body.language);
			break;
		case 'favorites':
			return "user = " + connection.escape(req.body.user) + " AND book = " + connection.escape(req.body.book);
			break;
		case 'reviews':
			return "user = " + connection.escape(req.body.user) + " AND book = " + connection.escape(req.body.book);
			break;
		case 'reviewcomments':
			return "0"
			break;
	}
};

var search_params = function(req) {
	var t = req.params.table

	switch (t) {
		case 'users':
			return "userId = " + connection.escape(req.query.userId);
			break;
		case 'books':
			return "title = " + connection.escape(req.query.title) + " AND author = " + connection.escape(req.query.author);
			break;
		case 'authors':
			return "firstName = " + connection.escape(req.query.firstName) + " AND lastName = " + connection.escape(req.query.lastName);
			break;
		case 'categories':
			return "categoryName = " + connection.escape(req.query.categoryName);
			break;
		case 'languages':
			return "language = " + connection.escape(req.query.language);
			break;
		case 'reviews':
			if (req.query.user && req.query.book) {
				return "user = " + connection.escape(req.query.user) + " AND book = " + connection.escape(req.query.book);
				break;
			} else if (req.query.book) {
				return "book = " + connection.escape(req.query.book);
				break;
			}
		case 'reviewcomments':
			return "review = " + connection.escape(req.query.review);
			break;
	}
};


module.exports.uploadCb = function(req, res) {
	var storage = s3({
		destination: function(req, file, cb) {

			cb(null, 'projectbookworm/covers');

		},
		filename: function(req, file, cb) {

			cb(null, req.params.id + '.jpg');

		},
		bucket: conf.get('bucket'),
		region: conf.get('region')
	});



	var upload = multer({
		storage: storage
	}).single('file');


	upload(req, res, function(err) {
		if (err) {
			winston.error(err);
			res.json({
				errno: -6
			});
			return;
		}
		res.json({
			"message": "success"
		});
	});

};

module.exports.tableGetCb = function(req, res) {
	//connection.connect();

	var table = helpers.map_table(req.params.table);

	var cb = function(err, rows, fields) {

		if (err) {
			winston.error('Error while performing query. ' + err);
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (rows.length) {
			if (req.query.fields != undefined) {
				var jsonArr = [];
				var json = {};
				var data = {};


				var columns = req.query.fields.split(',');

				rows.forEach(function(item, outerIndex) {
					columns.forEach(function(field, innerIndex) {

						data[field] = rows[outerIndex][field];
						if (table === 'Users') {
							data.password = {};
						}


						merge(json, data);


					});

					jsonArr.push(json);
					json = {};

				});
				data = {};

				data[req.params.table] = [{
					count: rows.length
				}, jsonArr];



				res.send(data);


			} else {
				var json = {};

				if (table = "Users") {
					rows.forEach(function(item, index) {
						item.password = {};
					});

					json[req.params.table] = [{
						count: rows.length
					}, rows];
					res.send(json);
				} else {
					json[req.params.table] = [{
						count: rows.length
					}, rows];
					res.send(json);
				}


			}



			//connection.end
		} else if (!rows.length) {
			winston.warn('There are no ' + req.params.table + ' on this database.');
			res.send({
				'message': 'There are no ' + req.params.table + ' on this database.',
				errno: 0
			});
		}
	}

	var orderby = '';

	if (req.query.orderby) {
		orderby = 'ORDER BY ' + connection.escapeId(req.query.orderby);
	}


	if (req.query.count) {
		connection.query('SELECT * from ?? ' + orderby + ' LIMIT ?', [table, parseInt(req.query.count)], cb);
	} else if (req.query.offset && req.query.limit) {
		connection.query('SELECT * from ?? ' + orderby + ' LIMIT ?,? ', [table, parseInt(req.query.offset), parseInt(req.query.limit)], cb);
	} else {
		connection.query('SELECT * from ?? ' + orderby, [table], cb);
	}
};


module.exports.bookPostCb = function(req, res) {
	var decoded = jwt.decode(req.headers.authorization.split(' ')[1], conf.get('secret'));

	if (decoded.admin) {
		req.params.table = 'books';

		var table = helpers.map_table(req.params.table);
		var body = helpers.build_body(req);
		var args = build_args(req);


		connection.query('SELECT * from ' + table + ' WHERE ' + args, function(err, rows, fields) {
			if (err) {
				winston.error('Error while performing query.' + err);
				res.send({
					'message': 'There has been a problem with the server.',
					'errno': -5
				});
			} else if (rows.length) {
				var msg;

				if (table === 'Categories') {
					msg = 'Category';
				} else {
					msg = table.slice(0, table.length - 1);
				}


				res.send({
					'message': msg + ' already exists.',
					'id': rows[0][fields[0].name],
					errno: -1
				});
			} else if (!rows.length) {
				connection.query('INSERT INTO ' + table + ' SET ?', body, function(err, results) {

					if (!err) {
						res.send({
							'message': 'success',
							'id': results.insertId
						});
						//connection.end();
					} else {
						winston.error('Error while performing query. ' + err);

						res.send({
							'message': 'There has been a problem with the server.',
							'errno': -5
						});
					}
				});
			}
		});
	} else {
		res.send({
			message: 'You are forbidden from creating this object.',
			errno: -7
		});
	}
}



module.exports.tablePostCb = function(req, res) {
	//connection.connect();

	var table = helpers.map_table(req.params.table);
	var body = helpers.build_body(req);
	var args = build_args(req);

	connection.query('SELECT * from ' + table + ' WHERE ' + args, function(err, rows, fields) {
		if (err) {
			winston.error('Error while performing query.' + err);
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (rows.length) {
			var msg;

			if (table === 'Categories') {
				msg = 'Category';
			} else {
				msg = table.slice(0, table.length - 1);
			}


			res.send({
				'message': msg + ' already exists.',
				'id': rows[0][fields[0].name],
				errno: -1
			});
		} else if (!rows.length) {
			connection.query('INSERT INTO ' + table + ' SET ?', body, function(err, results) {

				if (!err) {
					res.send({
						'message': 'success',
						'id': results.insertId
					});
					//connection.end();
				} else {
					winston.error('Error while performing query. ' + err);

					res.send({
						'message': 'There has been a problem with the server.',
						'errno': -5
					});
				}
			});
		}
	});
};

module.exports.favoriteSearchCb = function(req, res) {

	var cb = function(err, rows, fields) {
		if (err) {
			winston.error('Error while performing query. ' + err);

			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (rows.length) {
			var json = {};

			json.favorites = [{
				count: rows.length
			}, rows];

			res.send(json);
		} else if (!rows.length) {
			winston.warn('There are no favorites with the requested parameters.');
			res.send({
				'message': 'There are no favorites with the requested parameters.',
				errno: -2
			});
		}
	};

	if (req.query.user && req.query.book) {
		var params = "user = " + connection.escape(req.query.user) + " AND book = " + connection.escape(req.query.book);

	} else if (req.query.user && !req.query.book) {
		var params = "user = " + connection.escape(req.query.user);

	}

	var orderby = '';

	if (req.query.orderby) {
		orderby = ' ORDER BY ' + connection.escapeId(req.query.orderby);
	}


	if (req.query.limit && req.query.offset) {
		connection.query('SELECT * from Favorites JOIN Books ON Favorites.book=Books.bookId WHERE ' + params + orderby + ' LIMIT ?,?', [parseInt(req.query.offset), parseInt(req.query.limit)], cb);

	} else if (req.query.count) {
		connection.query('SELECT * from Favorites JOIN Books ON Favorites.book=Books.bookId WHERE ' + params + orderby + ' LIMIT ?', parseInt(req.query.count), cb);

	} else {
		connection.query('SELECT * from Favorites JOIN Books ON Favorites.book=Books.bookId WHERE ' + params + orderby, cb);
	}


};


module.exports.reviewSearchCb = function(req, res) {

	var cb = function(err, rows, fields) {
		if (err) {
			winston.error('Error while performing query. ' + err);

			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (rows.length) {
			var json = {};



			json.reviews = [{
				count: rows.length
			}, rows];

			res.send(json);



		} else if (!rows.length) {
			winston.warn('There are no reviews with the requested parameters.');
			res.send({
				'message': 'There are no reviews with the requested parameters.',
				errno: -2
			});
		}
	};

	if (req.query.user && req.query.book) {
		var params = "user = " + connection.escape(req.query.user) + " AND book = " + connection.escape(req.query.book);
	} else if (req.query.book) {
		var params = "book = " + connection.escape(req.query.book);
	}

	var orderby = '';

	if (req.query.orderby) {
		orderby = ' ORDER BY ' + connection.escapeId(req.query.orderby);
	}


	if (req.query.limit && req.query.offset) {

		connection.query('SELECT Reviews.*, Users.username from Reviews JOIN Users ON Reviews.user=Users.userId WHERE ' + params + orderby + ' LIMIT ?,?', [parseInt(req.query.offset), parseInt(req.query.limit)], cb);



	} else if (req.query.count) {

		connection.query('SELECT Reviews.*, Users.username from Reviews JOIN Users ON Reviews.user=Users.userId WHERE ' + params + orderby + ' LIMIT ?', parseInt(req.query.count), cb);



	} else {

		connection.query('SELECT Reviews.*, Users.username from Reviews JOIN Users ON Reviews.user=Users.userId WHERE ' + params + orderby, cb);


	}


};

module.exports.revCommentSearchCb = function(req, res) {

	var cb = function(err, rows, fields) {
		if (err) {
			winston.error('Error while performing query. ' + err);

			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (rows.length) {
			var json = {};

			json.reviewcomments = [{
				count: rows.length
			}, rows];

			res.send(json);
		} else if (!rows.length) {
			winston.warn('There are no reviews with the requested parameters.');
			res.send({
				'message': 'There are no reviews with the requested parameters.',
				errno: -2
			});
		}
	};


	var params = "review = " + connection.escape(req.query.review);


	var orderby = '';

	if (req.query.orderby) {
		orderby = ' ORDER BY ' + connection.escapeId(req.query.orderby);
	}


	if (req.query.limit && req.query.offset) {

		connection.query('SELECT ReviewComments.*, Users.username from ReviewComments JOIN Users ON ReviewComments.user=Users.userId WHERE ' + params + orderby + ' LIMIT ?,?', [parseInt(req.query.offset), parseInt(req.query.limit)], cb);



	} else if (req.query.count) {

		connection.query('SELECT ReviewComments.*, Users.username from ReviewComments JOIN Users ON ReviewComments.user=Users.userId WHERE ' + params + orderby + ' LIMIT ?', parseInt(req.query.count), cb);



	} else {

		connection.query('SELECT ReviewComments.*, Users.username from ReviewComments JOIN Users ON ReviewComments.user=Users.userId WHERE ' + params + orderby, cb);


	}


};



module.exports.searchCb = function(req, res) {
	var table = helpers.map_table(req.params.table);



	var params = search_params(req);

	connection.query('SELECT * from ?? WHERE ' + params, [table], function(err, rows, fields) {
		if (err) {
			winston.error('Error while performing query. ' + err);

			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (rows.length) {
			var json = {};

			json[req.params.table] = [{
				count: rows.length
			}, rows];

			res.send(json);
		} else if (!rows.length) {
			winston.warn('There are no ' + req.params.table + ' with the requested parameters.');
			res.send({
				'message': 'There are no ' + req.params.table + ' with the requested parameters.',
				errno: -2
			});
		}

	});


};


module.exports.countCb = function(req, res) {
	//connection.connect();

	var table = helpers.map_table(req.params.table);

	var cb = function(err, rows, fields) {

		if (err) {
			winston.error('Error while performing query. ' + err);
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (rows.length) {



			res.send(rows);


			//connection.end
		} else if (!rows.length) {
			winston.warn('There are no ' + req.params.table + ' on this database.');
			res.send({
				'message': 'There are no ' + req.params.table + ' on this database.',
				errno: 0
			});
		}
	}

	if (req.query) {
		var params = 'WHERE ' + search_params(req);
	} else {
		var params = "";
	}


	connection.query('SELECT count(*) AS count from ?? ' + params, [table], cb);
};

module.exports.idGetCb = function(req, res) {
	//connection.connect();

	var table = helpers.map_table(req.params.table);
	var id = helpers.build_id(req);


	connection.query('SELECT * from ' + table + ' WHERE ?', id, function(err, rows, fields) {
		if (err) {
			winston.error('Error while performing query. ' + err);

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

					if (table === 'Users' && item === 'password') {
						data[item] = "";

					} else {
						data[item] = rows[0][item];
					}

					if (table === 'Categories') {
						json['category'] = merge(json.category, data);
					} else {
						json[req.params.table.slice(0, table.length - 1)] = merge(json[req.params.table.slice(0, table.length - 1)], data);
					}

				});
			} else if (table === 'Categories') {
				json['category'] = rows;
			} else {

				if (table === 'Users') {
					rows[0].password = "";
				}

				json[req.params.table.slice(0, table.length - 1)] = rows;



			}


			res.send(json);
			//connection.end();

		} else if (!rows.length) {
			winston.warn('There are no ' + req.params.table + ' with the requested id.');
			res.send({
				'message': 'There are no ' + req.params.table + ' with the requested id.',
				errno: -2
			});
		}
	});
};

module.exports.idPutCb = function(req, res) {
	//connection.connect();	


	var table = helpers.map_table(req.params.table);
	var id = helpers.build_id(req);
	var args = build_args(req);
	var decoded = jwt.decode(req.headers.authorization.split(' ')[1], conf.get('secret'));


	connection.query('SELECT * FROM ' + table + ' WHERE ?', [id], function(err, results) {
		if (err) {
			winston.error('Error while performing query. ' + err);


			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});

		} else if(!results.length){
			callback(-2);
		} else {
			switch (req.params.table) {
				case 'users':

					console.log(decoded.username);
					console.log(results[0].username);

					if (!(results[0].username == decoded.username)) {
						callback(-7);
					} else {
						verify();
					}
					break;
				case 'reviews':
					if (!(results[0].user == decoded.userId)) {
						callback(-7);
					} else {
						verify();
					}

					break;
				case 'reviewcomments':
					if (!(results[0].user == decoded.userId)) {
						callback(-7);
					} else {
						verify();
					}
					
					break;
				default:
					 verify();
			}
		}
	});

	var verify = function () {
		connection.query('SELECT * FROM ' + table + ' WHERE ' + args, function(err, rows, fields){
			if (err){
				console.log(err);

				callback(-5);
			} else if (rows.length) {
				var msg;

				if (table === 'Categories') {
					msg = 'Category';
				} else {
					msg = table.slice(0, table.length - 1);
				}


				res.send({
					'message': msg + ' already exists.',
					'id': rows[0][fields[0].name],
					errno: -1
				});
			} else {
				callback(0);
			}
		});
	}




	var callback = function (err) {
		if (err == -7){
			res.send({
				message: 'You are forbidden from modifiying this object.',
				errno: err
			});
		} else if (err == -5){
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (err == -2){
			res.send({
				'message': 'There are no ' + req.params.table + ' with the requested parameters.',
				'errno': -2
			});
		} else {

			connection.query('UPDATE ' + table + ' SET ? WHERE ?', [req.body, id], function(err, results) {
				if (err) {
					winston.error('Error while performing query. ' + err);

					res.send({
						'message': 'There has been a problem with the server.',
						'errno': -5
					});
				}
				if (results.affectedRows) {
					connection.query('SELECT * from ' + table + ' WHERE ?', id, function(err, rows) {
						if (!err) {
							var json = {};
							if (table === 'Categories') {
								json['category'] = rows;
							} else {
								json[req.params.table.slice(0, table.length - 1)] = rows;
								
								if (table === 'Users'){
									json.user[0].password = "";
								}

								
							}


							var msg = {
								'message': 'success'
							};
							res.send(merge(msg, json));
							//connection.end();
						} else {
							winston.error('Error while performing query. ' + err);

							res.send({
								'message': 'There has been a problem with the server.',
								'errno': -5
							});
						}
					});
				} else if (!results.affectedRows) {
					winston.warn('There are no ' + req.params.table + ' with the requested id.');
					res.send({
						'message': 'There are no ' + req.params.table + ' with the requested id.',
						errno: -2
					});
				}
			});
		}
	}
	
};

module.exports.idDeleteCb = function(req, res) {
	//connection.connect();

	var table = helpers.map_table(req.params.table);
	var id = helpers.build_id(req);

	var decoded = jwt.decode(req.headers.authorization.split(' ')[1], conf.get('secret'));


	connection.query('SELECT * FROM ' + table + ' WHERE ?', [id], function(err, results) {
		if (err) {
			winston.error('Error while performing query. ' + err);


			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});

		} else if(!results.length){
			callback(-2);
		} else {
			switch (req.params.table) {
				case 'users':

					console.log(decoded.username);
					console.log(results[0].username);

					if (!(results[0].username == decoded.username)) {
						callback(-7);
					} else {
						callback(0);
					}
					break;
				case 'reviews':
					if (!(results[0].user == decoded.userId)) {
						callback(-7);
					} else {
						callback(0);
					}

					break;
				case 'reviewcomments':
					if (!(results[0].user == decoded.userId)) {
						callback(-7);
					} else {
						callback(0);
					}
					
					break;
				default:
					 callback(0);
			}
		}
	});
	
	
	var callback = function(err){
		if (err == -7){
			res.send({
				message: 'You are forbidden from modifiying this object.',
				errno: err
			});
		} else if (err == -2){
			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else {
			connection.query('DELETE FROM ' + table + ' WHERE ?', id, function(err, results) {
				if (err) {
					winston.error('Error while performing query. ' + err);

					res.send({
						'message': 'There has been a problem with the server.',
						'errno': -5
					});
				}
				if (results.affectedRows) {
					res.send({
						'message': 'success'
					});
					//connection.end();
				} else if (!results.affectedRows) {
					winston.warn('There are no ' + req.params.table + ' with the requested id.');
					res.send({
						'message': 'There are no ' + req.params.table + ' with the requested id.',
						errno: -2
					});
				}
			});	
		}


		
	}
		
	
};