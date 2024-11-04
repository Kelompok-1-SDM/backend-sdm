import { Client } from 'minio';
import crypto from 'crypto';


const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT!, // Replace with your MinIO endpoint
    port: Number(process.env.MINIO_PORT!),            // Replace with your MinIO port
    useSSL: false,         // Set to true if using SSL
    accessKey: process.env.MINIO_ACCESS_KEY!, // Your MinIO access key
    secretKey: process.env.MINIO_SECRET_KEY!  // Your MinIO secret key
});

// Function to calculate the hash of the file
export const calculateFileHash = (fileBuffer: Buffer): string => {
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
};

export const uploadFileToCdn = async (file: Express.Multer.File, hash: string, type: 'progress' | 'lampiran' | 'profil' | 'chat') => {
    const fileName = `${type}_${hash}`; // Use originalname for the filename

    const bucketName = 'sdm-jti';
    const metaData = {
        'Content-Type': file.mimetype,
    };

    await minioClient.putObject(bucketName, fileName, file.buffer, file.buffer.length, metaData); // Upload directly using buffer
    return `https://${process.env.MINIO_ENDPOINT_PUBLIC!}/${bucketName}/${fileName}`
}