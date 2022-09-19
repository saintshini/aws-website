import boto3
import pytest
from write_table_01 import write_into_table

@pytest.fixture
def name_table():
    return 'visitorCounter'

@pytest.fixture
def create_table_db(dynamodb_client,name_table):
    dynamodb_client.create_table(TableName=name_table,
        KeySchema=[
            {'AttributeName': 'id',
            'KeyType': 'HASH'
            }],
        AttributeDefinitions=[
            {'AttributeName': 'id',
            'AttributeType': 'S'
            }])
    yield

@pytest.fixture
def test_write_into_table(create_table_db):
    write_into_table(create_table_db);
    data = {'id':'count','visitor_count':'0'};
    response = create_table_db.get_item(Key={'id':data['id']});
    actual_output = response['Item'];
    assert actual_output == data;

@pytest.fixture
def list_all_tables(dynamodb_client):
    tables = dynamodb_client.tables.all();
    assert tables ==['visitorCounter']
    