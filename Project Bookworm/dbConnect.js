var conf = require('./config');
var mysql = require('mysql');


var dbConnect = function () {


	var connection = mysql.createConnection({
		host: conf.get('host'),
		user: conf.get('user'),
		password: conf.get('password'),
		database: conf.get('database')
	});

	return connection;
}

module.exports = dbConnect;