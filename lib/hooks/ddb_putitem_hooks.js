// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = credentials;
AWS.config.update({region:'us-east-1'});
var ddb = new AWS.DynamoDB();

var params = {
  TableName: 'visitor_count',
  Item: {
    'id' : {S: 'count'},
    'visitor_count' : {S: '0'}
  }
};

// Call DynamoDB to add the item to the table
ddb.putItem(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data);
  }
});