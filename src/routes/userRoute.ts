import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController';

const router = express.Router();

router.get('/', [], userController.fetchAllUser)

router.post('/', [
    body('nip').isString().trim().toLowerCase(),
    body('password').isString().trim(),
    body('nama').isString().trim(),
    body('profile_image').isString().trim(),
    body('role').isIn(['admin', 'manajemen', 'dosen']).trim().withMessage('Role are admin, manajemen, dosen'),
    body('email').isEmail().trim().withMessage("Email is needed"),
], userController.createUser);

export default router;