var put = function(sensorNumber, temperature){
    var AWS = require('aws-sdk');
    var moment = require('moment-timezone');
    var conf = require('./conf');

    AWS.config.update({region: conf.get('region'), 
		       endpoint: conf.get('endpoint')});
    
    var docClient = new AWS.DynamoDB.DocumentClient();
    
    var timestamp = moment().tz("Asia/Manila").format('MMMM Do YYYY, h:mm:ss a');
    var params = {
	TableName: 'SensorRecords',
	Item: {
	    sensorNumber: sensorNumber,
	    temperature: temperature,
	    timestamp: timestamp
	}
    };
    
    docClient.put(params, function(err, data){
	if (err){
	    console.log(err);
	} else {
	    //console.log(data);
	}
    });
}

module.exports = put;
