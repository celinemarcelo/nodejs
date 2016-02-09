var AWS = require('aws-sdk');
var conf = require('./config');
var fs = require('fs');
var express = require('express');

var app = express();

app.listen(8002);

AWS.config.update({
    region: conf.get('region'),
    endpoint: conf.get('endpoint')
});

var docClient = new AWS.DynamoDB.DocumentClient();

var params = {
    TableName: "SensorRecords",
    KeyConditionExpression: "#snum > :zro",
    ExpressionAttributeNames: {
        "#snum": "sensorNumber"
    },
    ExpressionAttributeValues: {
        ":zro": 0
    }
};


app.get('/', function(req, res) {
    docClient.query(params, function(err, data) {
        if (err) {
            console.log(err); // an error occurred
        } else {
            console.log(req);
            res.send(data.Items);
        }
    });
});