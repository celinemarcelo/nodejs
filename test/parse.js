var express = require('express');
var bodyParser = require('body-parser');
var app = express();




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

function getName(req){
	var name = req.params.name;


	return name;
}

exports.getName = getName;