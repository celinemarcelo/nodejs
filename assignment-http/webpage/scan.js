var scan = function(){
    var AWS = require('aws-sdk');
    var conf = require('./config');
    var fs = require('fs');
    
    AWS.config.update({region: conf.get('region'),
		       endpoint: conf.get('endpoint')});
    
    var docClient = new AWS.DynamoDB.DocumentClient();
    
    var params = {
	TableName: 'SensorRecords'
    };
    
    docClient.scan(params, function(err, data) {
	if (err) {
            console.log(err); // an error occurred
	} else {
            //console.log("The Scan call evaluated " + data.ScannedCount + " items");
            //console.log(data); // successful response
	    
	    fs.writeFile('data.json', JSON.stringify(data.Items, null, 4));
	}
    });
};

module.exports = scan;