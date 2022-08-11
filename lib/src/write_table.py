import json
import boto3

dynamodb = boto3.resource('dynamodb');
table_name = 'visitor_count';
table = dynamodb.Table(table_name)

def lambda_handler(event, context):

    response = table.get_item(Key= {'id' : 'count'})
    count = response['Item']['visitor_count']

    new_count = str(int(count)+1)
    response = table.update_item(
        Key= {'id': 'count'},
        UpdateExpression= 'set visitor_count = :c',
        ExpressionAttributeValues= {':c': new_count},
        ReturnValues= 'UPDATED_NEW'
    )
    return {'statusCode': 200,
        'body': new_count
    }