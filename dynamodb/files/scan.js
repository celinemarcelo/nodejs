var AWS = require('aws-sdk');

AWS.config.update({region:'ap-northeast-1a', endpoint:'http://localhost:8000'});


var docClient = new AWS.DynamoDB.DocumentClient();

var params = {
    TableName: 'SensorRecords',
    Limit: 5  // Limits the number of results per page (beyond the default 1MB limit)
};

console.log("Calling the Scan API on the Image table");
docClient.scan(params, function(err, data) {
    if (err) {
        console.log(err); // an error occurred
    } else {
        console.log("The Scan call evaluated " + data.ScannedCount + " items");
        console.log(data); // successful response
    }
});