import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigwAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface AutomaxStackProps extends cdk.StackProps {
  domainName?: string;
  certificateArn?: string;
}

/**
 * AutoMax (formerly a Base44 app) rebuilt on AWS.
 *
 * Replaces:
 *  - Base44 managed NoSQL DB       -> DynamoDB (5 tables, one per entity)
 *  - Base44 built-in auth          -> Cognito User Pool (+ a "role" custom attribute)
 *  - Base44 Deno backend functions -> 9 Lambda functions (Node 20), ported 1:1
 *  - Base44 hosting                -> S3 + CloudFront (frontend), S3 (ad photos)
 *  - Base44 secrets                -> Secrets Manager (Stripe/Twilio/Resend/NCR keys)
 */
export class AutomaxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AutomaxStackProps) {
    super(scope, id, props);

    // ----------------------------------------------------------------------
    // Secrets — fill these in via `aws secretsmanager put-secret-value` (see README)
    // ----------------------------------------------------------------------
    const appSecrets = new secretsmanager.Secret(this, 'AutomaxAppSecrets', {
      secretName: 'automax/app-secrets',
      description: 'Stripe / Twilio / Resend / Irish NCR API credentials for AutoMax',
      secretObjectValue: {
        STRIPE_SECRET_KEY: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
        STRIPE_WEBHOOK_SECRET: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
        TWILIO_ACCOUNT_SID: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
        TWILIO_AUTH_TOKEN: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
        TWILIO_PHONE_NUMBER: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
        RESEND_API_KEY: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
        IRISH_NCR_API_KEY: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
      },
    });

    // ----------------------------------------------------------------------
    // DynamoDB — one table per Base44 entity. PK = id (ULID/UUID generated on write).
    // GSIs mirror the fields the app actually queries by (see base44/entities/*.jsonc RLS).
    // ----------------------------------------------------------------------
    const userAdTable = new dynamodb.Table(this, 'UserAdTable', {
      tableName: 'Automax-UserAd',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    userAdTable.addGlobalSecondaryIndex({
      indexName: 'byOwner',
      partitionKey: { name: 'created_by_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_date', type: dynamodb.AttributeType.STRING },
    });
    userAdTable.addGlobalSecondaryIndex({
      indexName: 'byStatusSubsection',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'subsection', type: dynamodb.AttributeType.STRING },
    });

    const messageTable = new dynamodb.Table(this, 'MessageTable', {
      tableName: 'Automax-Message',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    messageTable.addGlobalSecondaryIndex({
      indexName: 'byOwner',
      partitionKey: { name: 'created_by_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_date', type: dynamodb.AttributeType.STRING },
    });
    messageTable.addGlobalSecondaryIndex({
      indexName: 'bySeller',
      partitionKey: { name: 'seller_user_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_date', type: dynamodb.AttributeType.STRING },
    });

    const reportAdTable = new dynamodb.Table(this, 'ReportAdTable', {
      tableName: 'Automax-ReportAd',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    reportAdTable.addGlobalSecondaryIndex({
      indexName: 'byOwner',
      partitionKey: { name: 'created_by_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_date', type: dynamodb.AttributeType.STRING },
    });

    const verificationCodeTable = new dynamodb.Table(this, 'VerificationCodeTable', {
      tableName: 'Automax-VerificationCode',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl', // auto-expire old codes
    });
    verificationCodeTable.addGlobalSecondaryIndex({
      indexName: 'byTarget',
      partitionKey: { name: 'target', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_date', type: dynamodb.AttributeType.STRING },
    });
    verificationCodeTable.addGlobalSecondaryIndex({
      indexName: 'byIp',
      partitionKey: { name: 'client_ip', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_date', type: dynamodb.AttributeType.STRING },
    });

    // Base44's "User" entity only stored the app-specific `role` field — everything
    // else (email, name, password) was handled by Base44's built-in auth. Cognito
    // now owns identity; this table just holds the app-specific profile extension.
    const userProfileTable = new dynamodb.Table(this, 'UserProfileTable', {
      tableName: 'Automax-UserProfile',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }, // Cognito sub
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // ----------------------------------------------------------------------
    // Cognito — replaces Base44's built-in auth
    // ----------------------------------------------------------------------
    const userPool = new cognito.UserPool(this, 'AutomaxUserPool', {
      userPoolName: 'automax-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        fullname: { required: false, mutable: true },
        phoneNumber: { required: false, mutable: true },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }), // 'admin' | 'user'
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // COGNITO_DEFAULT (the implicit default before this was added) is a
      // dev-only sender capped at ~50 emails/day shared across the whole
      // pool -- signup confirmation, password reset, everything. Discovered
      // live 2026-08-30: a real user's signup confirmation email silently
      // never arrived, leaving them stuck between "user already exists" on
      // re-signup and "user not confirmed" on login. automax.ie is verified
      // in SES (DKIM only, no MAIL FROM domain / SPF changes needed) --
      // requires SES production access to send to arbitrary real users, not
      // just SES-sandbox-verified addresses; see backend/README.md.
      email: cognito.UserPoolEmail.withSES({
        fromEmail: 'accounts@automax.ie',
        fromName: 'AutoMax',
        sesVerifiedDomain: 'automax.ie',
      }),
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'AutomaxUserPoolClient', {
      userPool,
      authFlows: { userPassword: true, userSrp: true },
      generateSecret: false, // public SPA client
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          props?.domainName ? `https://${props.domainName}/auth/callback` : 'http://localhost:5173/auth/callback',
        ],
        logoutUrls: [
          props?.domainName ? `https://${props.domainName}/login` : 'http://localhost:5173/login',
        ],
      },
      // NOTE: Google/Apple sign-in ("Continue with Google/Apple" on the Login page)
      // requires registering Cognito as an OAuth client in the Google Cloud Console /
      // Apple Developer portal, then adding a cognito.UserPoolIdentityProviderGoogle /
      // ...Apple construct here with those credentials, and listing them in
      // supportedIdentityProviders below. Left out of this scaffold since it needs
      // your own Google/Apple app credentials. Email/password auth works without it.
    });

    // Hosted UI domain — required for the OAuth redirect flow (social login).
    const userPoolDomain = new cognito.UserPoolDomain(this, 'AutomaxUserPoolDomain', {
      userPool,
      cognitoDomain: { domainPrefix: `automax-${this.account}` }, // must be globally unique
    });

    // ----------------------------------------------------------------------
    // S3 — ad photos (replaces Base44's file storage) + frontend static site
    // ----------------------------------------------------------------------
    const photosBucket = new s3.Bucket(this, 'AutomaxPhotosBucket', {
      bucketName: `automax-photos-${this.account}-${this.region}`,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'], // tighten to your real domain(s) post-launch
          allowedHeaders: ['*'],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const frontendBucket = new s3.Bucket(this, 'AutomaxFrontendBucket', {
      bucketName: `automax-frontend-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Using the older, very stable Origin Access Identity pattern here (rather
    // than the newer Origin Access Control constructs) since it's been part of
    // aws-cdk-lib since early CDK v2 and works with any recent version.
    const frontendOai = new cloudfront.OriginAccessIdentity(this, 'FrontendOAI');
    frontendBucket.grantRead(frontendOai);
    const photosOai = new cloudfront.OriginAccessIdentity(this, 'PhotosOAI');
    photosBucket.grantRead(photosOai);

    const certificate = props?.certificateArn
      ? acm.Certificate.fromCertificateArn(this, 'Cert', props.certificateArn)
      : undefined;

    const frontendDistribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultRootObject: 'index.html',
      domainNames: props?.domainName ? [props.domainName, `www.${props.domainName}`] : undefined,
      certificate,
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, { originAccessIdentity: frontendOai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      // SPA routing: unknown paths fall back to index.html for React Router
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    const photosDistribution = new cloudfront.Distribution(this, 'PhotosDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(photosBucket, { originAccessIdentity: photosOai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    new s3deploy.BucketDeployment(this, 'DeployPlaceholder', {
      sources: [s3deploy.Source.data('placeholder.txt', 'Deploy the real frontend build with: npm run build && aws s3 sync dist/ s3://<bucket>')],
      destinationBucket: frontendBucket,
    });

    // ----------------------------------------------------------------------
    // Lambda — shared config + the 9 ported functions + entity CRUD API
    // ----------------------------------------------------------------------
    const entryDir = path.join(__dirname, '..', '..', 'lambda');

    const nodeFnDefaults: Partial<lambdaNode.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      // lambda/ lives outside the cdk/ project root (sibling directory in the
      // monorepo), so NodejsFunction can't auto-detect it from cdk/'s own
      // lockfile — point it at lambda/'s lockfile explicitly.
      depsLockFilePath: path.join(entryDir, 'package-lock.json'),
      // Bundle the AWS SDK v3 packages ourselves rather than relying on whichever
      // version happens to ship in the Lambda Node24 base image (safer, and
      // @aws-sdk/s3-request-presigner specifically isn't guaranteed to be present).
      bundling: { minify: true, sourceMap: false, target: 'node24' },
      environment: {
        USERAD_TABLE: userAdTable.tableName,
        MESSAGE_TABLE: messageTable.tableName,
        REPORTAD_TABLE: reportAdTable.tableName,
        VERIFICATIONCODE_TABLE: verificationCodeTable.tableName,
        USERPROFILE_TABLE: userProfileTable.tableName,
        PHOTOS_BUCKET: photosBucket.bucketName,
        PHOTOS_CDN_DOMAIN: photosDistribution.distributionDomainName,
        APP_SECRETS_ARN: appSecrets.secretArn,
        USER_POOL_ID: userPool.userPoolId,
        APP_ORIGIN: props?.domainName ? `https://${props.domainName}` : `https://${frontendDistribution.distributionDomainName}`,
      },
    };

    const entityApiFn = new lambdaNode.NodejsFunction(this, 'EntityApiFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'entity-api', 'index.mjs'),
      timeout: cdk.Duration.seconds(10),
    } as lambdaNode.NodejsFunctionProps);

    const contactSellerFn = new lambdaNode.NodejsFunction(this, 'ContactSellerFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'contactSeller', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    const createCheckoutSessionFn = new lambdaNode.NodejsFunction(this, 'CreateCheckoutSessionFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'createCheckoutSession', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    const deleteAccountFn = new lambdaNode.NodejsFunction(this, 'DeleteAccountFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'deleteAccount', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    const downloadReceiptFn = new lambdaNode.NodejsFunction(this, 'DownloadReceiptFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'downloadReceipt', 'index.mjs'),
      memorySize: 512,
    } as lambdaNode.NodejsFunctionProps);

    const getVehicleDetailsFn = new lambdaNode.NodejsFunction(this, 'GetVehicleDetailsFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'getVehicleDetails', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    const sendVerificationCodeFn = new lambdaNode.NodejsFunction(this, 'SendVerificationCodeFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'sendVerificationCode', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    const stripeWebhookFn = new lambdaNode.NodejsFunction(this, 'StripeWebhookFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'stripeWebhook', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    const submitContactFormFn = new lambdaNode.NodejsFunction(this, 'SubmitContactFormFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'submitContactForm', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    const verifyCodeFn = new lambdaNode.NodejsFunction(this, 'VerifyCodeFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'verifyCode', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    const presignUploadFn = new lambdaNode.NodejsFunction(this, 'PresignUploadFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'presignUpload', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    // Backs base44.auth.updateMe() -- lets a user edit their own profile
    // fields without going through entity-api's admin-only User RLS (which
    // exists specifically to stop self-role-promotion). See index.mjs.
    const updateProfileFn = new lambdaNode.NodejsFunction(this, 'UpdateProfileFn', {
      ...nodeFnDefaults,
      entry: path.join(entryDir, 'updateProfile', 'index.mjs'),
    } as lambdaNode.NodejsFunctionProps);

    // Grant table access
    for (const fn of [
      entityApiFn, contactSellerFn, createCheckoutSessionFn, deleteAccountFn,
      downloadReceiptFn, sendVerificationCodeFn, stripeWebhookFn, verifyCodeFn, presignUploadFn,
      submitContactFormFn, getVehicleDetailsFn, updateProfileFn,
    ]) {
      userAdTable.grantReadWriteData(fn);
      messageTable.grantReadWriteData(fn);
      reportAdTable.grantReadWriteData(fn);
      verificationCodeTable.grantReadWriteData(fn);
      userProfileTable.grantReadWriteData(fn);
      appSecrets.grantRead(fn);
    }
    photosBucket.grantReadWrite(entityApiFn);
    photosBucket.grantPut(presignUploadFn);
    deleteAccountFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminDeleteUser'],
        resources: [userPool.userPoolArn],
      })
    );

    // ----------------------------------------------------------------------
    // API Gateway (HTTP API) — Cognito JWT authorizer on protected routes
    // ----------------------------------------------------------------------
    const httpApi = new apigw.HttpApi(this, 'AutomaxHttpApi', {
      apiName: 'automax-api',
      corsPreflight: {
        allowOrigins: props?.domainName ? [`https://${props.domainName}`, `https://www.${props.domainName}`] : ['*'],
        allowMethods: [apigw.CorsHttpMethod.GET, apigw.CorsHttpMethod.POST, apigw.CorsHttpMethod.PUT, apigw.CorsHttpMethod.DELETE],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const jwtAuthorizer = new apigwAuthorizers.HttpUserPoolAuthorizer('CognitoAuthorizer', userPool, {
      userPoolClients: [userPoolClient],
    });

    const route = (
      path_: string,
      method: apigw.HttpMethod,
      fn: lambdaNode.NodejsFunction,
      authRequired: boolean,
    ) => {
      // Construct IDs can't contain '/', '{', or '}' — build a safe, unique one from the route.
      const safeId = `${fn.node.id}Integration${method}${path_}`.replace(/[^A-Za-z0-9]/g, '');
      httpApi.addRoutes({
        path: path_,
        methods: [method],
        integration: new apigwIntegrations.HttpLambdaIntegration(safeId, fn),
        authorizer: authRequired ? jwtAuthorizer : undefined,
      });
    };

    // Generic entity CRUD — auth enforced *inside* the Lambda per-entity RLS rules,
    // so anonymous reads of active ads still work (route itself has no authorizer;
    // the handler reads the Authorization header itself when present).
    route('/entities/{entity}', apigw.HttpMethod.GET, entityApiFn, false);
    route('/entities/{entity}', apigw.HttpMethod.POST, entityApiFn, false);
    route('/entities/{entity}/{id}', apigw.HttpMethod.GET, entityApiFn, false);
    route('/entities/{entity}/{id}', apigw.HttpMethod.PUT, entityApiFn, false);
    route('/entities/{entity}/{id}', apigw.HttpMethod.DELETE, entityApiFn, false);

    route('/functions/contactSeller', apigw.HttpMethod.POST, contactSellerFn, false);
    route('/functions/createCheckoutSession', apigw.HttpMethod.POST, createCheckoutSessionFn, false);
    route('/functions/deleteAccount', apigw.HttpMethod.POST, deleteAccountFn, false);
    route('/functions/downloadReceipt', apigw.HttpMethod.POST, downloadReceiptFn, false);
    route('/functions/getVehicleDetails', apigw.HttpMethod.POST, getVehicleDetailsFn, false);
    route('/functions/sendVerificationCode', apigw.HttpMethod.POST, sendVerificationCodeFn, false);
    route('/functions/verifyCode', apigw.HttpMethod.POST, verifyCodeFn, false);
    route('/functions/submitContactForm', apigw.HttpMethod.POST, submitContactFormFn, false);
    route('/functions/updateProfile', apigw.HttpMethod.POST, updateProfileFn, false);
    // Stripe webhook is called by Stripe's servers, never the browser — no CORS/auth needed
    route('/webhooks/stripe', apigw.HttpMethod.POST, stripeWebhookFn, false);
    route('/uploads/presign', apigw.HttpMethod.POST, presignUploadFn, false);

    // ----------------------------------------------------------------------
    // Outputs
    // ----------------------------------------------------------------------
    new cdk.CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'UserPoolDomain', { value: `${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com` });
    new cdk.CfnOutput(this, 'FrontendBucketName', { value: frontendBucket.bucketName });
    new cdk.CfnOutput(this, 'FrontendDistributionDomain', { value: frontendDistribution.distributionDomainName });
    new cdk.CfnOutput(this, 'PhotosBucketName', { value: photosBucket.bucketName });
    new cdk.CfnOutput(this, 'PhotosDistributionDomain', { value: photosDistribution.distributionDomainName });
  }
}
