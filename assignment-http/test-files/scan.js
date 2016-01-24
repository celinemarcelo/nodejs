var AWS = require('aws-sdk');

AWS.config.update({region:'ap-northeast-1',
		   endpoint:'https://dynamodb.ap-northeast-1.amazonaws.com'});

var docClient = new AWS.DynamoDB.DocumentClient();

var params = {
    TableName: 'SensorRecords'
};


docClient.scan(params, function(err, data) {
    if (err) {
        console.log(err); // an error occurred
    } else {
        console.log("The Scan call evaluated " + data.ScannedCount + " items");
        console.log(data); // successful response
    }
});
