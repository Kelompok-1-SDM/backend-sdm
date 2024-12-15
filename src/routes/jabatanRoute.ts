import express from 'express';
import { body, query } from 'express-validator';
import * as jabatanController from '../controllers/jabatanController';
import { authorize } from '../middlewares/authorizations';

const router = express.Router();

router.get('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
    query('is_pic').isBoolean().optional().toBoolean().withMessage("This key is optional and it's string"),
    query('is_pic').optional().notEmpty().withMessage("This key should not be empty"),
], jabatanController.fetchJabatan)

router.post('/', authorize(['admin', 'manajemen']), [
    body('nama_jabatan').isString().trim().toLowerCase().withMessage("This key is optional and it's string"),
    body('nama_jabatan').notEmpty().withMessage("This key should not be empty"),
    body('is_pic').isBoolean().optional().toBoolean().withMessage("This key is optional and it's string"),
    body('is_pic').notEmpty().withMessage("This key should not be empty"),
], jabatanController.createJabatan)

router.put('/', authorize(['admin', 'manajemen']), [
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
    body('nama_jabatan').isString().optional().trim().toLowerCase().withMessage("This key is optional and it's string"),
    body('nama_jabatan').optional().notEmpty().withMessage("This key should not be empty"),
    body('is_pic').isBoolean().optional().toBoolean().withMessage("This key is optional and it's string"),
    body('is_pic').optional().notEmpty().withMessage("This key should not be empty"),
], jabatanController.updateJabatan)

router.delete('/', authorize(['admin', 'manajemen']), [
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
], jabatanController.deleteUser)


export default router;