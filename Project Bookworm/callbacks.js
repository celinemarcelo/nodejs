var multer = require('multer');
var s3 = require( 'multer-storage-s3' );
var merge = require('merge');
var winston = require('winston');
var jwt = require('jsonwebtoken');
var paginate = require('node-paginate-anything');



var helpers = require('./helpers');
var dbConnect = require('./dbConnect');
var conf = require('./config');

var connection = dbConnect();


winston.add(winston.transports.File, {
	filename: './pb.log', 
	level: 'info',
	name: 'pb-logs'
});

module.exports.uploadCb = function(req, res){
	var storage = s3({
		destination : function( req, file, cb ) {
			
			cb( null, 'projectbookworm/covers' );
			
		},
		filename    : function( req, file, cb ) {
			
			cb( null, req.params.id + '.jpg');
			
		},
		bucket      : conf.get('bucket'),
		region      : conf.get('region')
	});



	var upload = multer({
		storage: storage
	}).single('file');


	upload(req,res,function(err){
            if(err){
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
	function sortByKey(array, key) {
	    return array.sort(function(a, b) {
	        var x = a[key]; var y = b[key];
	        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	    });
	}


	var table = helpers.map_table(req.params.table);
	
	var cb = function(err, rows, fields) {

		if (err) {
			winston.error('Error while performing query. ' + err);
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

				data[req.params.table] = [{count: rows.length}, jsonArr];
				



				res.send(data);


			} else {
				var json = {};


				json[req.params.table] = [{count: rows.length}, rows];
				
				
				res.send(json);
			}




			
			//connection.end
		} else if (!rows.length) {
			winston.warn('There are no ' + req.params.table +' on this database.');
			res.send({
				'message': 'There are no ' + req.params.table + ' on this database.',
				errno: 0
			});
		}
	}

	var orderby = '';

	if (req.query.orderby){
		orderby = 'ORDER BY ' + connection.escapeId(req.query.orderby);
	}
	

	if (req.query.count) {
		connection.query('SELECT * from ?? ' + orderby + ' LIMIT ?', [table, parseInt(req.query.count)], cb);
	} else if (req.query.offset && req.query.limit){
		connection.query('SELECT * from ?? ' + orderby + ' LIMIT ?,? ', [table, parseInt(req.query.offset), parseInt(req.query.limit)], cb);
	} else {
		connection.query('SELECT * from ?? ' + orderby, [table], cb);
	}
};


module.exports.bookPostCb = function(req, res){
	var decoded = jwt.decode(req.headers.authorization.split(' ')[1], conf.get('secret'));

	if (decoded.admin) {
		req.params.table = 'books';

		var table = helpers.map_table(req.params.table);
		var body = helpers.build_body(req);
		var args = helpers.build_args(req);


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
					'message':  msg + ' already exists.',
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
		res.sendStatus(401);
	}
}



module.exports.tablePostCb = function(req, res) {
	//connection.connect();

	var table = helpers.map_table(req.params.table);
	var body = helpers.build_body(req);
	var args = helpers.build_args(req);

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
				'message':  msg + ' already exists.',
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

module.exports.searchCb = function(req, res) {
	var table = helpers.map_table(req.params.table);
	var params = helpers.search_params(req);

	connection.query('SELECT * from ?? WHERE ' + params, [table], function(err, rows, fields) {
		if (err){
			winston.error('Error while performing query. ' + err); 

			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} else if (rows.length) {
			res.send(rows);

		} else if (!rows.length){
			winston.warn('There are no ' + req.params.table + ' with the requested parameters.');
			res.send({
				'message': 'There are no ' + req.params.table + ' with the requested parameters.',
				errno: -2
			});
		}	

	});


};

module.exports.idGetCb = function(req, res) {
	//connection.connect();

	var table = helpers.map_table(req.params.table);
	var id = helpers.build_id(req);
	

	connection.query('SELECT * from ' + table + ' WHERE ?', id, function(err, rows, fields) {
		 if (err){
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


	connection.query('UPDATE ' + table + ' SET ? WHERE ?', [req.body, id], function(err, results) {
		if (err){
			winston.error('Error while performing query. ' + err); 

			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
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
					winston.error('Error while performing query. ' + err); 

					res.send({
						'message': 'There has been a problem with the server.',
						'errno': -5
					});
				}
			});
		} else if (!results.affectedRows){
			winston.warn('There are no ' + req.params.table + ' with the requested id.');
			res.send({
				'message': 'There are no ' + req.params.table + ' with the requested id.',
				errno: -2
			});
		}
	});
};

module.exports.idDeleteCb = function(req, res) {
	//connection.connect();

	var table = helpers.map_table(req.params.table);
	var id = helpers.build_id(req);


	connection.query('DELETE FROM ' + table + ' WHERE ?', id, function(err, results) {
		if (err) {
			winston.error('Error while performing query. ' + err); 

			res.send({
				'message': 'There has been a problem with the server.',
				'errno': -5
			});
		} if (results.affectedRows) {
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
};