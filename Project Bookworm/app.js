var express = require('express');
var bodyParser = require('body-parser')

app = express();
app.use(bodyParser.json());


app.listen(8004);

app.get('/v1/users', function(req, res) {
	res.send("Hello there!");

});

app.post('/v1/users', function(req, res) {
	res.json(req.body);
});