import express from 'express';
import { body, query } from 'express-validator';
import * as agendaController from '../controllers/agendaController';
import authorize from '../middlewares/authorizations';
import { handleFileUploadArray } from '../middlewares/uploadFiles';

const router = express.Router();

router.get('/',
    [authorize(['admin', 'manajemen', 'dosen']),
    query('uid').isString().trim().optional().toLowerCase().withMessage('This key is required and is string'),
    query('uid').notEmpty().optional().withMessage("This key should be not empty"),
    ], agendaController.fetchAgenda)

router.post('/',
    [authorize(['admin', 'manajemen', 'dosen']),
    query('uid').isString().trim().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty"),
    body('uid_user').isString().trim().withMessage('This key is required and is string'),
    body('uid_user').notEmpty().withMessage("This key should be not empty"),
    body('jadwal_agenda').isISO8601().trim().toDate().withMessage('This key is required and is ISO8601'),
    body('jadwal_agenda').notEmpty().withMessage("This key should be not empty"),
    body('nama_agenda').isString().trim().withMessage('This key is required and is string'),
    body('nama_agenda').notEmpty().withMessage("This key should be not empty"),
    body('deskripsi_agenda').isString().trim().withMessage('This key is required and is string'),
    body('deskripsi_agenda').notEmpty().withMessage("This key should be not empty"),
    body('status').isIn(['rencana', 'jalan', 'selesai']).trim().withMessage('List tugaskan(role) are "rencana", "jalan", "selesai"'),
    body('status').notEmpty().withMessage("This key should be not empty"),
    ], agendaController.createAgenda)

router.post('/progress',
    [authorize(['admin', 'manajemen', 'dosen']),
        handleFileUploadArray,
    query('uid_agenda').isString().trim().withMessage('This key is required and is string'),
    query('uid_agenda').notEmpty().withMessage("This key should be not empty"),
    body('deskripsi_progress').isString().trim().withMessage('This key is required and is string'),
    body('deskripsi_progress').notEmpty().withMessage("This key should be not empty"),
    ], agendaController.createProgressAgenda)

router.put('/',
    [authorize(['admin', 'manajemen', 'dosen']),
    query('uid').isString().trim().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty"),
    body('uid_user').isString().optional().trim().withMessage('This key is optional and is string'),
    body('uid_user').optional().notEmpty().withMessage("This key should be not empty"),
    body('jadwal_agenda').isISO8601().optional().trim().toDate().withMessage('This key is optional and is ISO8601'),
    body('jadwal_agenda').optional().notEmpty().withMessage("This key should be not empty"),
    body('nama_agenda').isString().optional().trim().withMessage('This key is optional and is string'),
    body('nama_agenda').optional().notEmpty().withMessage("This key should be not empty"),
    body('deskripsi_agenda').isString().optional().trim().withMessage('This key is optional and is string'),
    body('deskripsi_agenda').optional().notEmpty().withMessage("This key should be not empty"),
    body('status').isIn(['rencana', 'jalan', 'selesai']).optional().trim().withMessage('List tugaskan(role) are "rencana", "jalan", "selesai"'),
    body('status').optional().notEmpty().withMessage("This key should be not empty"),
    ], agendaController.createAgenda)


router.post('/progress',
    [authorize(['admin', 'manajemen', 'dosen']),
        handleFileUploadArray,
    query('uid').isString().trim().withMessage('This key is optional and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty"),
    body('uid_agenda').isString().optional().trim().withMessage('This key is optional and is string'),
    body('uid_agenda').optional().notEmpty().withMessage("This key should be not empty"),
    body('deskripsi_progress').isString().optional().trim().withMessage('This key is optional and is string'),
    body('deskripsi_progress').optional().notEmpty().withMessage("This key should be not empty"),
    ], agendaController.createProgressAgenda)

router.delete('/',
    [authorize(['admin', 'manajemen', 'dosen']),
    query('uid').isString().trim().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty")
    ], agendaController.deleteAgenda)

router.delete('/progress',
    [authorize(['admin', 'manajemen', 'dosen']),
    query('uid').isString().trim().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty")
    ], agendaController.deleteProgressAgenda)

export default router;