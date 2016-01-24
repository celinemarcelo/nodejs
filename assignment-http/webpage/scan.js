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
    TableName: 'SensorRecords'
};


app.get('/', function(req, res) {
    docClient.scan(params, function(err, data) {
        if (err) {
            console.log(err); // an error occurred
        } else {
            //console.log("The Scan call evaluated " + data.ScannedCount + " items");
            //console.log(data); // successful response
            //fs.writeFile('data.json', JSON.stringify(data.Items, null, 4));
            console.log(data.Items);
            res.send(data.Items);
        }
    });
});
