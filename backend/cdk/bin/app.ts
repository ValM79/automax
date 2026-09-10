#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AutomaxStack } from '../lib/automax-stack';

const app = new cdk.App();

new AutomaxStack(app, 'AutomaxStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-west-1', // Dublin — keeps data/latency in Ireland
  },
  // Set this to your real domain once you've requested/validated an ACM cert in us-east-1 (for CloudFront)
  // and created a hosted zone for automax.ie in Route 53.
  domainName: process.env.AUTOMAX_DOMAIN_NAME, // e.g. 'automax.ie'
  certificateArn: process.env.AUTOMAX_CERT_ARN, // ACM cert ARN in us-east-1
  opsAlertEmail: process.env.AUTOMAX_OPS_ALERT_EMAIL, // subscribed to the ops-alert SNS topic
});
