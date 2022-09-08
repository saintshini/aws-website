import json, boto3
import os

name_table = os.environ['NAME_TABLE']
region = os.environ['REGION']

dynamodb = boto3.resource('dynamodb',region_name= region);
table_name = name_table;
table = dynamodb.Table(table_name)

def write_into_table(table):
    table.put_item(
        Item={
            'id':'count',
            'visitor_count':'0'
        }
    )

def lambda_handler(event, context):

    response = table.get_item(Key= {'id' : 'count'})
    
    if "Item" not in response:
        write_into_table(table)
    else:
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