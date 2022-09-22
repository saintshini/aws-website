import pytest
from moto import mock_dynamodb
from src.write_table import write_into_table

@pytest.fixture
def name_table():
    return 'visitorCounter'

@mock_dynamodb
def test_write_into_table(dynamodb_client,name_table):
    creation_table = dynamodb_client.create_table(
        TableName=name_table,
        KeySchema=[
            {'AttributeName': 'id',
            'KeyType': 'HASH'
            }],
        AttributeDefinitions=[
            {'AttributeName': 'id',
            'AttributeType': 'S'
            }],
        BillingMode='PAY_PER_REQUEST'
    ),
    table_name = dynamodb_client.Table(name_table);
    write_into_table(table_name);
    list_tables = dynamodb_client.tables.all()
    print(list_tables)
    