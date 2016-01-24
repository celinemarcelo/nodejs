var express = require('express');
var jsonfile = require('jsonfile');
var scan = require('./scan');

var app = express();

app.listen(8002);

app.set('view engine', 'ejs');

app.get('/', function(req, res){
    scan();
    var data = jsonfile.readFileSync('data.json');
    res.render('pages/index', {
	data: data
    });
});
