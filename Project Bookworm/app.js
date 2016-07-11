var express = require('express');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');

var cors = require('./cors')
var cb = require('./callbacks');
var auth = require('./authenticate');
var conf = require('./config')


//err codes
//0 - no records on database
//-1 - already exists
//-2 - record not found
//-3 - wrong password
//-4 - token not accepted
//-5 - db error
//-6 - upload error


var app = express();
app.use(bodyParser.json());

app.listen(8004);

app.use('/v1', cors); 


app.use('/v1', expressJwt({
	secret: conf.get('secret')
}).unless({path: [{url: '/v1/users', methods: ['OPTIONS', 'POST']}, '/v1/authenticate', '/v1/books']}));





app.post('/v1/upload/:id', cb.uploadCb);

app.post('/v1/authenticate', auth.authenticate);


app.post('/v1/books', cb.bookPostCb);

app.route('/v1/:table')
	.get(cb.tableGetCb)

	.post(cb.tablePostCb);

app.route('/v1/:table/search')
	.get(cb.searchCb);

app.route('/v1/:table/:id')
	.get(cb.idGetCb)

	.put(cb.idPutCb)

	.delete(cb.idDeleteCb);
