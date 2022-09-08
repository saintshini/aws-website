import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, RedirectProtocol } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Distribution, OriginAccessIdentity, AllowedMethods, CachedMethods, ViewerProtocolPolicy, CachePolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { HostedZone, RecordTarget, ARecord } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { CertificateValidation, DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
// import VisitorCount from './baseline_visitor_count';
const config = require('../config/development.json'); //Fixme
const path = require('path');

export class ChallengeAwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // new VisitorCount(this,'visitor_count');

    const hostedZone = new HostedZone(this, 'hosted_zone', { zoneName: config.rootdomain, comment: 'A hosted zone for cloud resume challenge' });

    const certificateManagerCertificate = new DnsValidatedCertificate(this, 'certificate_manager', {
      domainName: `*.${config.rootdomain}`,
      hostedZone: hostedZone,
      region: config.region,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    const bucketSubdomain = new Bucket(this,'bucket_subdomain',{
      bucketName: config.subdomain,
      removalPolicy: RemovalPolicy.DESTROY
      // props default
      // store all the files for your website
    })

    const bucketRootdomain = new Bucket(this,'bucket_rootdomain',{
      bucketName: config.rootdomain,
      websiteRedirect: { hostName: config.subdomain, protocol: RedirectProtocol.HTTPS },
      removalPolicy: RemovalPolicy.DESTROY
      // props default
      // access your sample website
      // endpoint example return http://${config.rootdomain}.s3-website-us-east-1.amazonaws.com
    })


    new BucketDeployment(this, 'deployment_webserver', {
      sources: [Source.asset(path.resolve(__dirname, '../src'))],
      destinationBucket: bucketSubdomain
      //distribution: distribution,
      //distributionPaths: ['/*'],
    })

    const originAccessIdentity = new OriginAccessIdentity(this, 'origin_access_identity');
    bucketSubdomain.grantRead(originAccessIdentity);

    const distributionSubdomain = new Distribution(this, 'cloudfront_distribution_subdomain', {
      domainNames: [config.subdomain],
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(bucketSubdomain, {originAccessIdentity}),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      certificate: certificateManagerCertificate,
    });

    const distributionRootdomain = new Distribution(this, 'cloudfront_distribution_rootdomain', {
      domainNames: [config.rootdomain],
      defaultBehavior: {
        origin: new S3Origin(bucketSubdomain),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_DISABLED,
      },
      certificate: certificateManagerCertificate,
    });

    new ARecord(this, 'route53_recordSet', {
      recordName: 'www',
      zone: hostedZone,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(distributionRootdomain)
      ),
    });
  }
}