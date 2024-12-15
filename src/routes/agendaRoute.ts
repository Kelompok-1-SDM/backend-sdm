import express from 'express';
import { body, query } from 'express-validator';
import * as agendaController from '../controllers/agendaController';
import { authorize } from '../middlewares/authorizations';
import { handleFileUploadArray } from '../middlewares/uploadFiles';

const router = express.Router();

router.get('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().toLowerCase().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty"),
], agendaController.fetchAgenda)

router.post('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid_kegiatan').isString().trim().withMessage('This key is required and is string'),
    query('uid_kegiatan').notEmpty().withMessage("This key should be not empty"),
    body('jadwal_agenda').isISO8601().trim().toDate().withMessage('This key is required and is ISO8601'),
    body('jadwal_agenda').notEmpty().withMessage("This key should be not empty"),
    body('nama_agenda').isString().trim().withMessage('This key is required and is string'),
    body('nama_agenda').notEmpty().withMessage("This key should be not empty"),
    body('deskripsi_agenda').isString().trim().withMessage('This key is required and is string'),
    body('deskripsi_agenda').notEmpty().withMessage("This key should be not empty"),
    body('is_done').isBoolean().optional().toBoolean().withMessage("This key is required and is boolean"),
    body('is_done').optional().notEmpty().withMessage("This key should be not empty"),
    body('list_uid_user_kegiatan')
        .isArray().optional().withMessage('List user ditugaskan must be an array')
        .bail()
        .custom((value) => value.length > 0).withMessage('List user ditugaskan cannot be an empty array'),
    body('list_uid_user_kegiatan.*')
        .isString().trim().withMessage('Each userToKegiatanId in the list must be a string')
        .notEmpty().withMessage('userToKegiatanId cannot be empty'),
], agendaController.createAgenda)

router.post('/progress', authorize(['admin', 'manajemen', 'dosen']), handleFileUploadArray, [
    query('uid_agenda').isString().trim().withMessage('This key is required and is string'),
    query('uid_agenda').notEmpty().withMessage("This key should be not empty"),
    body('deskripsi_progress').isString().trim().withMessage('This key is required and is string'),
    body('deskripsi_progress').notEmpty().withMessage("This key should be not empty"),
], agendaController.createProgressAgenda)

router.put('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty"),
    body('uid_user').isString().optional().trim().withMessage('This key is optional and is string'),
    body('jadwal_agenda').isISO8601().optional().trim().toDate().withMessage('This key is optional and is ISO8601'),
    body('jadwal_agenda').optional().notEmpty().withMessage("This key should be not empty"),
    body('nama_agenda').isString().optional().trim().withMessage('This key is optional and is string'),
    body('nama_agenda').optional().notEmpty().withMessage("This key should be not empty"),
    body('deskripsi_agenda').isString().optional().trim().withMessage('This key is optional and is string'),
    body('deskripsi_agenda').optional().notEmpty().withMessage("This key should be not empty"),
    body('is_done').isBoolean().toBoolean().optional().withMessage("This key is optional and is boolean"),
    body('is_done').optional().notEmpty().withMessage("This key should be not empty"),
    body('list_uid_user_kegiatan')
        .isArray().optional().withMessage('List user ditugaskan must be an array')
        .bail()
        .custom((value) => value.length > 0).withMessage('List user ditugaskan cannot be an empty array'),
    body('list_uid_user_kegiatan.*')
        .isString().optional().trim().withMessage('Each userToKegiatanId in the list must be a string')
        .notEmpty().withMessage('userToKegiatanId cannot be empty'),
], agendaController.updateAgenda)


router.put('/progress', authorize(['admin', 'manajemen', 'dosen']), handleFileUploadArray, [
    query('uid').isString().trim().withMessage('This key is optional and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty"),
    body('uid_agenda').isString().optional().trim().withMessage('This key is optional and is string'),
    body('uid_agenda').optional().notEmpty().withMessage("This key should be not empty"),
    body('deskripsi_progress').isString().optional().trim().withMessage('This key is optional and is string'),
    body('deskripsi_progress').optional().notEmpty().withMessage("This key should be not empty"),
], agendaController.updateProgressAgenda)

router.delete('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty")
], agendaController.deleteAgenda)

router.delete('/user', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty"),
    query('uid_user_kegiatan').isString().trim().withMessage('This key is required and is string'),
    query('uid_user_kegiatan').notEmpty().withMessage("This key should be not empty")
], agendaController.deleteUserFromAgenda)

router.delete('/progress', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty")
], agendaController.deleteProgressAgenda)

router.delete('/progress-attachment', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().withMessage('This key is required and is string'),
    query('uid').notEmpty().withMessage("This key should be not empty"),
    query('uid_attachment').isString().trim().withMessage('This key is required and is string'),
    query('uid_attachment').notEmpty().withMessage("This key should be not empty")
], agendaController.deleteAttachmentProgress)

export default router;