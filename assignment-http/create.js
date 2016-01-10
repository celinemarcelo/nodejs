var AWS = require('aws-sdk');

AWS.config.update({
    region: "ap-northeast-1",
    endpoint: "https://dynamodb.ap-northeast-1.amazonaws.com"
});


var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "SensorRecords",
    KeySchema: [       
        { AttributeName: "sensorNumber", KeyType: "HASH"},  //Partition key
        { AttributeName: "timestamp", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "sensorNumber", AttributeType: "N" },
        { AttributeName: "timestamp", AttributeType: "S" },
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 10, 
        WriteCapacityUnits: 10
    }
};	

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});
