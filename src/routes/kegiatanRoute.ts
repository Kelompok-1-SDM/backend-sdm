import express from 'express';
import { body, query } from 'express-validator';
import * as kegiatanController from '../controllers/kegiatanController';
import authorize from '../middlewares/authorizations';

const router = express.Router();

router.get('/',
    [authorize(['admin', 'manajemen', 'dosen']),
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
    query('uid_user').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid_user').optional().notEmpty().withMessage("This key should not be empty"),
    query('status').isIn(['selesai', 'ditugaskan']).trim().optional().toLowerCase().withMessage('Status are "selesai", "ditugaskan'),
    query('status').optional().notEmpty().withMessage("This key should not be empty"),
    ], kegiatanController.fetchKegiatan)

router.post('/',
    [authorize(['admin', 'manajemen']),
    body('judul_kegiatan').isString().trim().withMessage("This key is required and it's string"),
    body('judul_kegiatan').notEmpty().withMessage("This key should not be empty"),
    body('tipe_kegiatan').isIn(['jti', 'non-jti']).toLowerCase().trim().withMessage('Tipe kegiatan are "jti", "non-jti"'),
    body('tipe_kegiatan').notEmpty().withMessage("This key should not be empty"),
    body('lokasi').isString().trim().withMessage("This key is required and it's string"),
    body('lokasi').notEmpty().withMessage("This key should not be empty"),
    body('tanggal').isISO8601().trim().toDate().withMessage('This key is required and is ISO8601'),
    body('tanggal').notEmpty().withMessage("This key should not be empty"),
    body('deskripsi').isString().trim().withMessage("This key is required and it's string"),
    body('deskripsi').notEmpty().withMessage("This key should not be empty"),
    body('list_kompetensi').isArray().withMessage('List kompetensi must be an array'),
    body('list_kompetensi').notEmpty().withMessage("This key should not be empty"),
    body('list_kompetensi.*').isString().trim().withMessage('List kompetensi(element) must be an string'),
    body('list_kompetensi.*').notEmpty().withMessage("This key should not be empty")
    ], kegiatanController.createKegiatan)

router.put('/',
    [authorize(['admin', 'manajemen']),
    query('uid').isString().trim().withMessage("This key is required and it's string"),
    query('uid').notEmpty().withMessage("This key should not be empty"),
    body('judul_kegiatan').isString().optional().trim().withMessage("This key is required and it's string"),
    body('judul_kegiatan').optional().notEmpty().withMessage("This key should not be empty"),
    body('tipe_kegiatan').isIn(['jti', 'non-jti']).optional().toLowerCase().trim().withMessage('Tipe kegiatan are "jti", "non-jti"'),
    body('tipe_kegiatan').optional().notEmpty().withMessage("This key should not be empty"),
    body('lokasi').isString().optional().trim().withMessage("This key is required and it's string"),
    body('lokasi').optional().notEmpty().withMessage("This key should not be empty"),
    body('tanggal').isISO8601().optional().trim().toDate().withMessage('This key is required and is ISO8601'),
    body('tanggal').optional().notEmpty().withMessage("This key should not be empty"),
    body('deskripsi').isString().optional().trim().withMessage("This key is required and it's string"),
    body('deskripsi').optional().notEmpty().withMessage("This key should not be empty"),
    body('list_kompetensi').isArray().optional().withMessage('List kompetensi must be an array'),
    body('list_kompetensi').optional().notEmpty().withMessage("This key should not be empty"),
    body('list_kompetensi.*').isString().optional().trim().withMessage('List kompetensi(element) must be an string'),
    body('list_kompetensi.*').optional().notEmpty().withMessage("This key should not be empty")
    ], kegiatanController.updateKegiatan)

router.delete('/',
    [authorize(['admin', 'manajemen']),
    query('uid').isString().trim().toLowerCase().withMessage("This key is required and it's string"),
    query('uid').notEmpty().withMessage("This key should not be empty"),
    ], kegiatanController.deleteKegiatan)


export default router;