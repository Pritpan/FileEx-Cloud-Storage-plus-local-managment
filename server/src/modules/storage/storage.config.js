import { S3Client } from '@aws-sdk/client-s3';

const REQUIRED_VARS = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    throw new Error(`[storage.config] Missing required environment variable: ${varName}.`);
  }
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default s3Client;
