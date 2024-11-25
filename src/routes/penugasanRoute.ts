import express from 'express';
import { body, query } from 'express-validator';
import * as penugasanController from '../controllers/penugasanController';
import { authorize } from '../middlewares/authorizations';

const router = express.Router();

router.get('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid_kegiatan').isString().trim().withMessage("This key is required and it's string"),
    query('uid_kegiatan').notEmpty().withMessage("This key should not be empty"),
    query('uid_user').isString().optional().trim().withMessage("This key is required and it's string"),
], penugasanController.fetchPenugasanByKegiatan)

router.post('/', authorize(['admin', 'manajemen']), [
    query('uid_kegiatan').isString().trim().withMessage("This key is required and it's string"),
    query('uid_kegiatan').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan').isArray().withMessage('List tugaskan must be an array'),
    body('list_user_ditugaskan').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan.*.uid_user').isString().trim().withMessage('List tugaskan(uid_user) must be an string'),
    body('list_user_ditugaskan.*.uid_user').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan.*.uid_jabatan').isString().trim().withMessage('List tugaskan(uid_jabatan) must be an string'),
    body('list_user_ditugaskan.*.uid_jabatan').notEmpty().withMessage("This key should not be empty"),
], penugasanController.tugaskanKegiatan)


router.put('/', authorize(['admin', 'manajemen']), [
    query('uid_kegiatan').isString().trim().withMessage("This key is required and it's string"),
    query('uid_kegiatan').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan').isArray().withMessage('List tugaskan must be an array'),
    body('list_user_ditugaskan').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan.*.uid_user').isString().optional().trim().withMessage('List tugaskan(uid_user) must be an string'),
    body('list_user_ditugaskan.*.uid_user').optional().notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan.*.uid_jabatan').isString().optional().trim().withMessage('List tugaskan(uid_jabatan) must be an string'),
    body('list_user_ditugaskan.*.uid_jabatan').optional().notEmpty().withMessage("This key should not be empty"),
], penugasanController.updatePenugasanKegiatan)

router.delete('/', authorize(['admin', 'manajemen']), [
    query('uid_kegiatan').isString().trim().withMessage("This key is required and it's string"),
    query('uid_kegiatan').notEmpty().withMessage("This key should not be empty"),
    query('uid_user').isString().trim().withMessage("This key is required and it's string"),
    query('uid_user').notEmpty().withMessage("This key should not be empty"),
], penugasanController.deletePenugasan)

export default router