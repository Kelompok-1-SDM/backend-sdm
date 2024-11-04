import express from 'express';
import { body, query } from 'express-validator';
import * as kompetensiController from '../controllers/kompetensiController';
import authorize from '../middlewares/authorizations';

const router = express.Router();

router.get('/',
    [authorize(['admin', 'manajemen', 'dosen']),
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
    ], kompetensiController.fetchKompetensi)

router.post('/',
    [authorize(['admin', 'manajemen']),
    body('nama_kompetensi').isString().trim().toLowerCase().withMessage("This key is optional and it's string"),
    body('nama_kompetensi').notEmpty().withMessage("This key should not be empty"),
    ], kompetensiController.createKompetensi)

router.put('/',
    [authorize(['admin', 'manajemen']),
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
    body('nama_kompetensi').isString().optional().trim().toLowerCase().withMessage("This key is optional and it's string"),
    body('nama_kompetensi').optional().notEmpty().withMessage("This key should not be empty"),
    ], kompetensiController.updateKompetensi)

router.get('/',
    [authorize(['admin', 'manajemen']),
    query('uid').isString().trim().optional().toLowerCase().withMessage("This key is optional and it's string"),
    query('uid').optional().notEmpty().withMessage("This key should not be empty"),
    ], kompetensiController.deleteUser)


export default router;