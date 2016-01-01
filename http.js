var http = require('http');
var fs = require('fs');
var url = require('url');


//var buf = fs.readFileSync('home.html');

//var str = buf.toString();


http.createServer(function (req, res){
    req.on('data', function(chunk){
	console.log(chunk);

    });

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World!');
}).listen(8000);

console.log('Listening to port 8000.');
