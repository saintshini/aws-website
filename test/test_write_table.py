import boto3
import pytest
from write_table import write_into_table

@pytest.fixture
def test_write_into_table():
    client = boto3.resource('dynamodb')
    name_table = 'test_visitor_count'
    table = dynamodb.create_table(TableName=table_name,
        KeySchema=[{'AttributeName': 'id','KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'id','AttributeType': 'S'}])
    data = {'id':'count','visitor_count':'0'}
    write_into_table(data)
    response = table.get_item(Key={'id':data['id']})
    actual_output = response['Item']
    assert actual_output == data