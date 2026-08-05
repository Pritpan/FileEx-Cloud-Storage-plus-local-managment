// =============================================================================
// storage.config.js — AWS S3 Client Singleton
//
// Responsibility:
//   Create and export a single configured S3Client instance for the entire
//   application. This is the ONLY place the AWS SDK is imported.
//
// WHY A SINGLETON:
//   The S3Client manages internal connection pooling and request signing.
//   Instantiating it multiple times wastes memory and may cause credential
//   resolution to run more than once. A singleton guarantees one client for
//   the entire process lifetime — identical reasoning to the Prisma singleton
//   in src/config/prisma.js.
//
// WHY ONLY THIS MODULE KNOWS ABOUT AWS:
//   Isolating the AWS SDK behind this module means the rest of the application
//   (services, controllers, repositories) never imports @aws-sdk directly.
//   If we ever migrate from S3 to Cloudflare R2, MinIO, or another provider,
//   only this file and the helpers in the storage module need to change.
//   Nothing outside storage/ is aware a cloud provider exists.
//
// WHY CREDENTIALS COME FROM ENVIRONMENT VARIABLES:
//   Hardcoded credentials would be committed to version control, exposing the
//   AWS account to anyone who can read the repository. Environment variables
//   keep secrets outside the codebase entirely. In production, they are
//   injected by the deployment platform (Railway, ECS task role, etc.).
//   In development, they are read from .env (which is .gitignored).
//
// Required environment variables (see .env.example):
//   AWS_REGION           — e.g. "ap-south-1"
//   AWS_BUCKET_NAME      — e.g. "fileex-storage"  (read by storage helpers)
//   AWS_ACCESS_KEY_ID    — IAM access key ID
//   AWS_SECRET_ACCESS_KEY — IAM secret access key
//
// Note: This file does NOT perform any network requests. The S3Client is
// lazy — it connects only when the first command is actually sent.
// =============================================================================

import { S3Client } from '@aws-sdk/client-s3';

// ---------------------------------------------------------------------------
// Validate that the required variables are present at startup.
// Fail fast with a clear message rather than letting the first S3 call fail
// with a cryptic AWS credential error deep inside a request handler.
// ---------------------------------------------------------------------------
const REQUIRED_VARS = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    throw new Error(
      `[storage.config] Missing required environment variable: ${varName}. ` +
      'Check .env.example for the full list.',
    );
  }
}

// ---------------------------------------------------------------------------
// S3 Client — single instance for the entire process.
//
// The AWS SDK reads AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY automatically
// from process.env when they are present. Passing `credentials` explicitly
// makes the source unambiguous and removes reliance on the SDK's credential
// provider chain (which would otherwise check ~/.aws/credentials,
// EC2 instance metadata, etc. in order — correct for production but
// confusing in development).
// ---------------------------------------------------------------------------
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default s3Client;
