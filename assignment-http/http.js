var http = require('http');
var url = require('url');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();



app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({extended: true}));

app.listen(8001);



app.post('/', function(req, res){
	console.log(req.body.sensorNumber);
	console.log(req.body.temperature);


});