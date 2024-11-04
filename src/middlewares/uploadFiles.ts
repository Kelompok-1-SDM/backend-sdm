import { NextFunction, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import multer from 'multer';
import { createResponse } from '../utils/utils';

const allowedMimeTypes = [
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/pdf', // .pdf
    'text/plain', // .txt
    'image/jpeg', // .jpg, .jpeg
    'image/png',  // .png
    'image/gif',  // .gif
    'image/svg+xml', // .svg
    'image/bmp', // .bmp
    'image/webp' // .webp
];

// Multer setup with validation
const uploadSingleFile = multer({
    limits: { fileSize: 1024 * 1024 * 10 }, // Limit file size to 10MB
    fileFilter: (req: Request, file, cb) => {
        if (allowedMimeTypes.slice(6).includes(file.mimetype)) {
            cb(null, true); // Accept file
        } else {
            const error = new Error('Invalid file type. Only documents (JPG, JPEG, PNG, GIF, SVG, BMP, WEBP) are allowed.');
            cb(error); // Reject file with error
        }
    }
}).single('file'); // Only expect a single file upload with field name 'lampiran'

/**
 * Middleware to handle file upload.
 */
export const handleFileUpload = (req: Request<ParamsDictionary, any, any, ParsedQs>, res: Response, next: NextFunction) => {

    if (!req.file) return next()

    uploadSingleFile(req as Request, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer-specific error
            res.status(400).json(createResponse(
                false,
                null,
                `Multer error: ${err.message}`,
            ))
            return
        } else if (err) {
            // General error (e.g., invalid file type)
            res.status(400).json(createResponse(
                false,
                null,
                `Upload error: ${err.message}`,
            ))
            return
        }

        // Proceed to the next middleware or controller if no errors
        next();
    });
};

/// Multer setup for handling multiple files
const uploadMultiple = multer({
    limits: { fileSize: 1024 * 1024 * 10 }, // Limit file size to 10MB per file
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true); // Accept file
        } else {
            const error = new Error('Invalid file type. Only documents (Word, Excel, PDF, TXT, JPG, JPEG, PNG, GIF, SVG, BMP, WEBP) are allowed.');
            cb(error); // Reject file with error
        }
    }
}).array('files', 10); // Expect up to 10 files with field name 'file'

export const handleFileUploadArray = (req: Request, res: Response, next: NextFunction) => {

    // Check if there's a file in the request
    if (!req.files) return next(); // No file uploaded, proceed to the next middleware

    uploadMultiple(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            // Handle Multer-specific errors (e.g., file too large, too many files, etc.)
            res.status(400).json(createResponse(
                false,
                null,
                `Multer error: ${err.message}`,
            ))
            return
        } else if (err) {
            // Handle general errors (e.g., invalid file type)
            res.status(400).json(createResponse(
                false,
                null,
                `Upload error: ${err.message}`,
            ))
            return
        }

        // Proceed to the next middleware or controller if no errors
        next();
    });
};