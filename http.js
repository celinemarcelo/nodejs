var http = require('http');
var fs = require('fs');

var buf = fs.readFileSync('home.html');

var str = buf.toString();


http.createServer(function (req, res){
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(str);
}).listen(8000);

console.log('Listening to port 8000.');
