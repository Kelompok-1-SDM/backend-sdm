import { Client } from 'minio';
import crypto from 'crypto';
import * as xlsx from 'xlsx';


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

export function generateResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    return { token, hash, expiresAt };
}

export interface UserDataExcel {
    nip: string;
    nama: string;
    email: string;
}

export async function parseExcel(file: Express.Multer.File, role: 'admin' | 'manajemen' | 'dosen') {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet || !sheet['!ref']) {
        throw new Error('The uploaded Excel file is empty or contains no readable data.');
    }

    const data = xlsx.utils.sheet_to_json<UserDataExcel>(sheet, { raw: true });

    return data.map(row => ({
        nip: row.nip || null,   // Handle missing values
        nama: row.nama || null,
        email: row.email || null,
        role: role
    }));
}

export function exportExcel(data: any[]) {
    if (data.length === 0) {
        throw new Error("No data to export");
    }

    // Dynamically extract headers from the first object keys
    const headers = Object.keys(data[0]);

    // Convert data to worksheet
    const worksheet = xlsx.utils.json_to_sheet(data);

    // Add headers to the sheet
    xlsx.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

    // Apply styling to headers (bold)
    const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1"); // Get range of the sheet
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: 0, c: col }); // First row, each column
        if (!worksheet[cellAddress]) continue; // Skip if cell doesn't exist
        worksheet[cellAddress].s = {
            font: { bold: true }, // Apply bold font
            alignment: { horizontal: "center" }, // Center align headers (optional)
        };
    }

    // Create a new workbook and append the worksheet
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write workbook to buffer
    const excelBuffer = xlsx.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
        cellStyles: true, // Required to enable cell styling
    });

    return excelBuffer;
}