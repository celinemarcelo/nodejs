var winston = require('winston');
var jwt = require('jsonwebtoken');
var merge = require('merge');

var dbConnect = require('./dbConnect');
var conf = require('./config');

var connection = dbConnect();


module.exports.authenticate = function(req, res) {
	var params = {
		username: req.body.username
	};

	var secret = conf.get('secret');

	if (req.headers.authorization) {
		var payload = jwt.decode(req.headers.authorization.split(' ')[1], secret);

		winston.info('User ' + payload.username + ' tried to access a restricted route.');

		//console.log(req);

		jwt.verify(req.headers.authorization.split(' ')[1], secret, function(err, decoded){

			if(!err){
				res.json({
					message: "Authenticated! Token accepted.",
					success: "ok"
				});	
			} else {
				res.json({
					message: "Login failed. Please try again.",
					errno: -4
				});
			}
		});


	} else {
		winston.info('User ' + req.body.username + ' requested a token.');
		connection.query('SELECT * from Users WHERE ?', params, function(err, results) {

			if (err) {
				winston.error(err);
			} else if (results.length > 0) {

				if (req.body.password === results[0].password) {
					
					if (results[0].username === "celine"){
						var json = {
							userId: '1',
							username: 'celine',
							registrationDate: results[0].registrationDate,
							admin: 'true'
						};	
					} else {
						var json = {
							userId: results[0].userId,
							username: results[0].username,
							registrationDate: results[0].registrationDate,
							admin: false
						};	
					}
					


					var token = jwt.sign(json, secret, {
						expiresIn: "1 day"
					});

					res.json({
						message: "Authenticated! Token issued.",
						token: token,
						success: "ok"
					});
					

				} else {
					winston.info('Wrong username/password!');
					res.send({
						message: 'Wrong username/password!',
						errno: -3
					});
				}

			} else {
				winston.info('Wrong username/password!');
				res.send({
					message: 'Wrong username/password!',
					errno: -2
				});
			}
		});
	}
};