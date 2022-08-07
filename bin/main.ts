#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ChallengeAwsStack } from '../lib/resources';

const app = new cdk.App();
new ChallengeAwsStack(app, 'ChallengeAwsStack', {
});