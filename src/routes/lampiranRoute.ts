import express from 'express';
import { query } from 'express-validator';
import * as lampiranController from '../controllers/lampiranController';
import { authorize } from '../middlewares/authorizations';
import { handleFileUploadArray } from '../middlewares/uploadFiles';

const router = express.Router();

router.post('/', authorize(['admin', 'manajemen', 'dosen']),
    handleFileUploadArray, [
    query('uid_kegiatan').isString().trim().withMessage("This key is required and it's string"),
    query('uid_kegiatan').notEmpty().withMessage("This key should not be empty"),
], lampiranController.createLampiran)

router.delete('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().withMessage("This key is required and it's string"),
    query('uid').notEmpty().withMessage("This key should not be empty"),
], lampiranController.deleteLampiran)

export default router