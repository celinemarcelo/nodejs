var express = require('express');

var app = express();

app.listen(8005);

app.set('view engine', 'ejs');

var options = {
	hostname: 'celinemarcelo.com',
	port: 8004,
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
});