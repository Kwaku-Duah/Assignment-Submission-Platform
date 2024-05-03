import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

dotenv.config();

const s3Config: S3ClientConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
};

const s3Client = new S3Client(s3Config);

export default s3Client;

const bucketName = process.env.BUCKET_NAME;

export const uploadFileToS3 = async (file: Express.Multer.File): Promise<string> => {
  // Transform the original name to replace underscores with '/'
  const transformedName = file.originalname.replace(/_/g, '/');

  const key = `${uuidv4()}-${transformedName}`;
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
    // ACL: 'public-read' as ObjectCannedACL is not available with this bucket,
  };
  await s3Client.send(new PutObjectCommand(params));
  return getFileUrl(key);
};

export const getFileUrl = (key: string): string => {
  return `https://${bucketName}.s3.amazonaws.com/${key}`;
};

export const uploadToS3 = async (files: Express.Multer.File[]): Promise<void> => {
  try {
    await Promise.all(
      files.map(async (file) => {
        await uploadFileToS3(file);
      })
    );
  } catch (error) {
    throw new Error('Error uploading files to S3: ' + error);
  }
};
