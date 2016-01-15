var convict = require('convict');

var conf = convict({
    region: {
	doc: "The region of the DynamoDB server.",
	format: String, 
	default: 'ap-northeast-1'
    },
    endpoint: {
	doc: "The endpoint of the DynamoDB server.",
	format: String, 
	default: 'https://dynamodb.ap-northeast-1.amazonaws.com'
    }
});

module.exports = conf;
