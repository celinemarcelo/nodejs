var http = require('http');
var qs = require('qs');


function generateData() {
    var sensorNumber = Math.floor((Math.random() * 10) + 1);
    var temperature = (Math.random() * 10) + 20;
    //console.log(sensorNumber);
    var data = qs.stringify({
	'sensorNumber': sensorNumber.toString(),
	'temperature': temperature.toString()
    });
    
    return data;
};


function start() {
    var postData = generateData();
    
    var options = {
	hostname: '127.0.0.1',
	port: 8001,
	path: '/',
	method: 'POST',
	headers: {
	    'Content-Type': 'application/x-www-form-urlencoded',
	    'Content-Length': postData.length
	}
    };
    
    var req = http.request(options, function(req, res) {});
    
    req.end(postData);
}

setInterval(start, 1000);
