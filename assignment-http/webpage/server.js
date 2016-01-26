var express = require('express');
var jsonfile = require('jsonfile');
var http = require('http');

var app = express();

var results;

app.listen(8003);

app.set('view engine', 'ejs');

var options = {
	hostname: 'celinemarcelo.com',
	port: 8002,
	method: 'GET',
};


app.get('/', function(req, response) {
	http.request(options, function(res) {
		//console.log(res);
		res.on('data', function(chunk) {
			//console.log(chunk);

			results += chunk;
			console.log("---------------------");
			console.log(results);
		});


	}).end();

	//console.log("DITO" + results);

	//response.render('pages/index', {
	//	data: data
	//});


});