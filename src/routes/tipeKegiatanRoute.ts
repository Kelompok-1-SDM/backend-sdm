import express from 'express';
import { body, query } from 'express-validator';
import * as tipeKegiatanController from '../controllers/tipeKegiatanController';
import { authorize } from '../middlewares/authorizations';

const router = express.Router();

router.get('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
    query('is_jti').isBoolean().optional().toBoolean().withMessage("This key is optional and it's boolean"),
    query('is_jti').optional().notEmpty().withMessage("This key should not be empty"),
], tipeKegiatanController.fetchTipeKegiatan)

router.post('/', authorize(['admin', 'manajemen']), [
    body('nama_tipe_kegiatan').isString().trim().toLowerCase().withMessage("This key is optional and it's string"),
    body('nama_tipe_kegiatan').notEmpty().withMessage("This key should not be empty"),
    body('is_jti').isBoolean().optional().toBoolean().withMessage("This key is optional and it's boolean"),
    body('is_jti').optional().notEmpty().withMessage("This key should not be empty"),
], tipeKegiatanController.createTipeKegiatan)

router.put('/', authorize(['admin', 'manajemen']), [
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
    body('nama_tipe_kegiatan').isString().optional().trim().toLowerCase().withMessage("This key is optional and it's string"),
    body('nama_tipe_kegiatan').optional().notEmpty().withMessage("This key should not be empty"),
    body('is_jti').isBoolean().optional().toBoolean().withMessage("This key is optional and it's boolean"),
    body('is_jti').optional().notEmpty().withMessage("This key should not be empty"),
], tipeKegiatanController.updateTipeKegiatan)

router.delete('/', authorize(['admin', 'manajemen']), [
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
], tipeKegiatanController.deleteUser)


export default router;