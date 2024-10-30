import express from 'express';
import { body, query } from 'express-validator';
import * as userController from '../controllers/userController';
import authorize from '../middlewares/authorizations';

const router = express.Router();

router.get('/',
    [authorize(['admin', 'manajemen']),
    query('uid').isString().trim().optional().toLowerCase(),
    query('role').isString().isIn(['admin', 'manajemen', 'dosen']).toLowerCase().trim().withMessage('Role are admin, manajemen, dosen').optional(),
    ], userController.fetchUsers)

router.post('/', [
    authorize(['admin']),
    body('nip').isString().toLowerCase().trim(),
    body('password').isString().trim(),
    body('nama').isString().trim(),
    body('profile_image').isString().trim(),
    body('role').isIn(['admin', 'manajemen', 'dosen']).toLowerCase().trim().withMessage('Role are admin, manajemen, dosen'),
    body('email').isEmail().trim(),
], userController.createUser);

router.put('/', [
    authorize(['admin', 'manajemen', 'dosen']),
    query('uid').isString().trim().toLowerCase(),
    body('nip').isString().toLowerCase().trim().optional(),
    body('password').isString().trim().optional(),
    body('nama').isString().trim().optional(),
    body('profile_image').isString().trim().optional(),
    body('role').isIn(['admin', 'manajemen', 'dosen']).toLowerCase().trim().optional().withMessage('Role are admin, manajemen, dosen'),
    body('email').isEmail().trim().optional(),
], userController.updateUser);

router.delete('/',
    [authorize(['admin']),
    query('uid').isString().trim().toLowerCase(),],
    userController.deleteUser
)

export default router;