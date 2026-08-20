import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

import s3Client from './storage.config.js';
import { PRESIGNED_URL_EXPIRATION_SECONDS } from './storage.constants.js';
import {
  UploadFailedError,
  StorageUnavailableError,
} from './storage.errors.js';

const BUCKET = process.env.AWS_BUCKET_NAME;

const generateUploadUrl = async (storageKey, mimeType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION_SECONDS,
    });

    return {
      uploadUrl,
      expiresIn: PRESIGNED_URL_EXPIRATION_SECONDS,
    };
  } catch (err) {
    throw new UploadFailedError('Failed to generate upload URL.');
  }
};

const generateDownloadUrl = async (storageKey) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION_SECONDS,
    });

    return {
      downloadUrl,
      expiresIn: PRESIGNED_URL_EXPIRATION_SECONDS,
    };
  } catch (err) {
    throw new StorageUnavailableError('Failed to generate download URL.');
  }
};

const generatePreviewUrl = async (storageKey) => {
  try {
    const { downloadUrl, expiresIn } = await generateDownloadUrl(storageKey);
    return { previewUrl: downloadUrl, expiresIn };
  } catch (err) {
    throw err;
  }
};

const objectExists = async (storageKey) => {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
    }));

    return true;
  } catch (err) {
    const isNotFound =
      err.$metadata?.httpStatusCode === 404 ||
      err.name === 'NotFound' ||
      err.name === 'NoSuchKey';

    if (isNotFound) {
      return false;
    }

    throw new StorageUnavailableError('Failed to verify object existence.');
  }
};

const deleteObject = async (storageKey) => {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
    }));
  } catch (err) {
    throw new StorageUnavailableError('Failed to delete object.');
  }
};

const storageService = {
  generateUploadUrl,
  generateDownloadUrl,
  generatePreviewUrl,
  objectExists,
  deleteObject,
};

export default storageService;
