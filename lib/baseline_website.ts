import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketAccessControl, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Distribution, OriginAccessIdentity, AllowedMethods, CachedMethods, ViewerProtocolPolicy, CachePolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { HostedZone, RecordTarget, ARecord } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { CertificateValidation, DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import VisitorCount from './baseline_visitor_count';

const path = require('path');

export class ChallengeAwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostedZoneName = this.node.tryGetContext('hostedZoneName');
    const aRecordName = this.node.tryGetContext('aRecordName');
    const bucketName = this.node.tryGetContext('bucketName');
    const regionCertificate = this.node.tryGetContext('regionCertificate');

    new VisitorCount(this,'visitor_count');

    const hostedZone = new HostedZone(this, 'hosted_zone_sandbox', { zoneName: hostedZoneName });

    const certificateManagerCertificate = new DnsValidatedCertificate(this, 'certificate_manager', {
      domainName: hostedZoneName,
      hostedZone: hostedZone,
      region: regionCertificate,
      validation: CertificateValidation.fromDns(),
    });

    const bucket = new Bucket(this,'bucket_web_site',{
      bucketName: bucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      accessControl: BucketAccessControl.PRIVATE,
      removalPolicy: RemovalPolicy.RETAIN,
    })

    const originAccessIdentity = new OriginAccessIdentity(this, 'origin_access_identity');
    bucket.grantRead(originAccessIdentity);

    const distribution = new Distribution(this, 'cloudfront_distribution', {
      domainNames: [hostedZoneName],
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(bucket, {originAccessIdentity}),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      certificate: certificateManagerCertificate,
    });

    new BucketDeployment(this, 'deployment_bucket', {
      destinationBucket: bucket,
      sources: [Source.asset(path.resolve(__dirname, '../src'))],
      distribution: distribution,
      distributionPaths: ['/*'],
    })

    new ARecord(this, 'route53_recordSet', {
      recordName: aRecordName,
      zone: hostedZone,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(distribution)
      ),
    });
  }
}