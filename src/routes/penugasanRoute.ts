import express from 'express';
import { body, query } from 'express-validator';
import * as penugasanController from '../controllers/penugasanController';
import authorize from '../middlewares/authorizations';

const router = express.Router();

router.post('/',
    [authorize(['admin', 'manajemen']),
    query('uid_kegiatan').isString().trim().withMessage("This key is required and it's string"),
    query('uid_kegiatan').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan').isArray().withMessage('List tugaskan must be an array'),
    body('list_user_ditugaskan').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan.*.uid_user').isString().trim().withMessage('List tugaskan(uid) must be an string'),
    body('list_user_ditugaskan.*.uid_user').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan.*.role').isIn(['pic', 'anggota']).trim().withMessage('List tugaskan(role) are "pic", "anggota"'),
    body('list_user_ditugaskan.*.role').notEmpty().withMessage("This key should not be empty")
    ], penugasanController.tugaskanKegiatan)


router.put('/',
    [authorize(['admin', 'manajemen']),
    query('uid').isString().trim().withMessage("This key is required and it's string"),
    query('uid').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan').isArray().withMessage('List tugaskan must be an array'),
    body('list_user_ditugaskan').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan.*.uid_user').isString().trim().withMessage('List tugaskan(uid) must be an string'),
    body('list_user_ditugaskan.*.uid_user').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan.*.role').isIn(['pic', 'anggota']).trim().withMessage('List tugaskan(role) are "pic", "anggota"'),
    body('list_user_ditugaskan.*.role').notEmpty().withMessage("This key should not be empty"),
    body('list_user_ditugaskan.*.status').isIn(['ditugaskan', 'selesai']).trim().withMessage('List tugaskan(status) are "ditugaskan", "selesai"'),
    body('list_user_ditugaskan.*.status').notEmpty().withMessage("This key should not be empty")
    ], penugasanController.updatePenugasanKegiatan)

router.delete('/',
    [authorize(['admin', 'manajemen']),
    query('uid_kegiatan').isString().trim().withMessage("This key is required and it's string"),
    query('uid_kegiatan').notEmpty().withMessage("This key should not be empty"),
    query('uid_user').isString().trim().withMessage("This key is required and it's string"),
    query('uid_user').notEmpty().withMessage("This key should not be empty"),
    ], penugasanController.deletePenugasan)

export default router