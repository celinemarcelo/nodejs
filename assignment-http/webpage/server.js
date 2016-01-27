var express = require('express');
var jsonfile = require('jsonfile');
var http = require('http');
var is = require('type-is')

var results = "";

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
		res.on('data', function(chunk) {
			results += chunk;
		});

		res.on('end', function() {
			response.render('pages/index', {
				data: JSON.parse(results)
			});
		});



	}).end();

	//console.log("DITO" + results);
});