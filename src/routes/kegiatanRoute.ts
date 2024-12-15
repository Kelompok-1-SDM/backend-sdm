import express from 'express';
import { body, query } from 'express-validator';
import * as kegiatanController from '../controllers/kegiatanController';
import { authorize } from '../middlewares/authorizations';

const router = express.Router();

router.get('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
    query('uid_user').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('is_done').isBoolean().optional().toBoolean().withMessage("is_done is optional and its boolean"),
    query('is_done').optional().notEmpty().withMessage("This key should not be empty"),
    query('tanggal').isISO8601().optional().trim().toDate().withMessage('This key is required and is ISO8601'),
    query('tanggal').optional().notEmpty().withMessage("This key should not be empty"),
], kegiatanController.fetchKegiatan)

router.post('/', authorize(['admin', 'manajemen', 'dosen']), [
    body('judul_kegiatan').isString().trim().withMessage("This key is required and it's string"),
    body('judul_kegiatan').notEmpty().withMessage("This key should not be empty"),
    body('tipe_kegiatan_uid').isString().trim().withMessage("This key is required and it's string"),
    body('tipe_kegiatan_uid').notEmpty().withMessage("This key should not be empty"),
    body('lokasi').isString().trim().withMessage("This key is required and it's string"),
    body('lokasi').notEmpty().withMessage("This key should not be empty"),
    body('tanggal_mulai').isISO8601().trim().toDate().withMessage('This key is required and is ISO8601'),
    body('tanggal_mulai').notEmpty().withMessage("This key should not be empty"),
    body('tanggal_akhir').isISO8601().trim().toDate().withMessage('This key is required and is ISO8601'),
    body('tanggal_akhir').notEmpty().withMessage("This key should not be empty"),
    body('is_done').isBoolean().optional().toBoolean().withMessage('This key is required and is Boolean'),
    body('is_done').optional().notEmpty().withMessage("This key should not be empty"),
    body('deskripsi').isString().trim().withMessage("This key is required and it's string"),
    body('deskripsi').notEmpty().withMessage("This key should not be empty"),
    body('progress').isString().optional().trim().withMessage("This key is required and it's string"),
    body('progress').optional().notEmpty().withMessage("This key should not be empty"),
    body('uid_jabatan').isString().optional().trim().withMessage("This key is required and it's string"),
    body('uid_jabatan').optional().notEmpty().withMessage("This key should not be empty"),
], kegiatanController.createKegiatan)

router.put('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().withMessage("This key is optional and it's string"),
    query('uid').notEmpty().withMessage("This key should not be empty"),
    body('judul_kegiatan').isString().optional().trim().withMessage("This key is optional and it's string"),
    body('judul_kegiatan').optional().notEmpty().withMessage("This key should not be empty"),
    body('tipe_kegiatan_uid').isString().optional().trim().withMessage("This key is optional and it's string"),
    body('tipe_kegiatan_uid').optional().notEmpty().withMessage("This key should not be empty"),
    body('lokasi').isString().optional().trim().withMessage("This key is optional and it's string"),
    body('lokasi').optional().notEmpty().withMessage("This key should not be empty"),
    body('tanggal_mulai').isISO8601().optional().trim().toDate().withMessage('This key is optional and is ISO8601'),
    body('tanggal_mulai').optional().notEmpty().withMessage("This key should not be empty"),
    body('tanggal_akhir').isISO8601().optional().trim().toDate().withMessage('This key is optional and is ISO8601'),
    body('tanggal_akhir').optional().notEmpty().withMessage("This key should not be empty"),
    body('is_done').isBoolean().optional().toBoolean().withMessage('This key is optional and is Boolean'),
    body('is_done').optional().notEmpty().withMessage("This key should not be empty"),
    body('deskripsi').isString().optional().trim().withMessage("This key is optional and it's string"),
    body('deskripsi').optional().notEmpty().withMessage("This key should not be empty"),
    body('progress').isString().optional().trim().withMessage("This key is optional and it's string"),
    body('progress').optional().notEmpty().withMessage("This key should not be empty"),
], kegiatanController.updateKegiatan)

router.delete('/', authorize(['admin', 'manajemen']), [
    query('uid').isString().trim().toLowerCase().withMessage("This key is required and it's string"),
    query('uid').notEmpty().withMessage("This key should not be empty"),
], kegiatanController.deleteKegiatan)

export default router;