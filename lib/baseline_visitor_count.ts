import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from "constructs";
import { Architecture, Runtime, Function, Code } from 'aws-cdk-lib/aws-lambda';
const {
    Role,
    ServicePrincipal
  } = require('aws-cdk-lib/aws-iam');
import { Table, BillingMode, AttributeType, TableClass } from 'aws-cdk-lib/aws-dynamodb'
import { Effect, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
const path = require('path');

class VisitorCount extends Construct {
    constructor(scope: any, id: string) {
        super(scope, id);

        const table_name = this.node.tryGetContext('table_name');

        const table_visitor_count = new Table(this,'table_visitor_count',{
          tableName: table_name,
          partitionKey: {name:'id', type: AttributeType.STRING},
          billingMode: BillingMode.PAY_PER_REQUEST,
          removalPolicy: RemovalPolicy.DESTROY,
          tableClass: TableClass.STANDARD_INFREQUENT_ACCESS
        });

        const roleLambdaService = new Role(this, 'lambda_service_role', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            description: 'role assumed by lambda service',
            roleName: `lambda_service_role`,
            path: '/',
            inlinePolicies: {
              'dynamoDB_actions': new PolicyDocument({
                statements: [
                  new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                      'dynamodb:Update*',
                      'dynamodb:PutItem',
                      'dynamodb:Get*',
                      'dynamodb:DescribeTable'
                    ],
                    resources: [table_visitor_count.tableArn],
                  }),
                ],
              }),
              'logGroup_actions': new PolicyDocument({
                statements: [
                  new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                      'logs:CreateLogStream',
                      'logs:PutLogEvents',
                      'logs:CreateLogGroup'
                    ],
                    resources: ['*'],
                  }),
                ],
              }),
            },
            removalPolicy: RemovalPolicy.DESTROY,
          });
        const write_table = new Function(this,'lambda_write_table_service', {
          handler: 'write_table.lambda_handler',
          code: Code.fromAsset(path.join(__dirname, './src')),
          runtime: Runtime.PYTHON_3_9,
          functionName: 'lambda_write_table_service',
          timeout: Duration.seconds(30),
          memorySize: 128,
          role: roleLambdaService,
          architecture: Architecture.ARM_64,
          environment:{
            NAME_TABLE: table_name
          }
        });
        new LambdaRestApi(this,'api_gateway_write_table',{
          handler: write_table,
          restApiName: 'api_write_table',
          description: 'rest api gateway for lambda write_table',
          deploy: true,
          deployOptions: {
            stageName: 'integration'
          },
        })
    }
}

export default VisitorCount;