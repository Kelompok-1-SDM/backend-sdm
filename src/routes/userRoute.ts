import express from 'express';
import { body, query } from 'express-validator';
import * as userController from '../controllers/userController';
import { authorize } from '../middlewares/authorizations';
import { handleFileUpload, uploadFileExcel } from '../middlewares/uploadFiles';

const router = express.Router();

router.get('/', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().optional().trim().toLowerCase().withMessage("This key is optional and it's string"),
    query('nip').isString().optional().trim().toLowerCase().withMessage("This key is optional and it's string"),
    query('nip').optional().notEmpty().withMessage("This key should not be empty"),
    query('role').isString().optional().isIn(['admin', 'manajemen', 'dosen']).toLowerCase().trim().withMessage("Role are 'admin', 'manajemen', 'dosen'"),
    query('role').optional().notEmpty().withMessage("This key should not be empty. Role are 'admin', 'manajemen', 'dosen'"),
], userController.fetchUsers)

router.get('/homepage-mobile', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().trim().toLowerCase().withMessage("This key is optional and it's string")
], userController.fetchDosenHomepage)

router.get('/homepage-web', authorize(['admin', 'manajemen'])
    , userController.fetchWebHomepage)

router.get('/statistic', authorize(['admin', 'manajemen', 'dosen']), [
    query('uid').isString().optional().trim().toLowerCase().withMessage("This key is optional and it's string"),
    query('year').isNumeric().optional().trim().toLowerCase().withMessage("This key is optional and it's numeric"),
    query('year').optional().notEmpty().withMessage("This key should not be empty"),
], userController.fetchUserStatistic)

router.get('/export', authorize(['admin']), [
    query('role').isIn(['admin', 'manajemen', 'dosen']).toLowerCase().trim().withMessage("Role are 'admin', 'manajemen', 'dosen'"),
], userController.exportUserBatch)

router.post('/', authorize(['admin']),
    handleFileUpload, [
    body('nip').isString().toLowerCase().trim().withMessage("This key is required and it's string"),
    body('nip').notEmpty().withMessage("This key should not be empty"),
    body('password').isString().trim().withMessage("This key is required and it's string"),
    body('password').notEmpty().withMessage("This key should not be empty"),
    body('nama').isString().trim().withMessage("This key is required and it's string"),
    body('nama').notEmpty().withMessage("This key should not be empty"),
    body('role').isIn(['admin', 'manajemen', 'dosen']).toLowerCase().trim().withMessage("Role are 'admin', 'manajemen', 'dosen'"),
    body('role').notEmpty().withMessage("This key should not be empty. Role are 'admin', 'manajemen', 'dosen'"),
    body('email').isEmail().trim().withMessage("This key is required and it's email"),
    body('email').notEmpty().withMessage("This key should not be empty")
], userController.createUser);

router.post('/import', authorize(['admin']),
    uploadFileExcel, [
    query('role').isIn(['admin', 'manajemen', 'dosen']).toLowerCase().trim().withMessage("Role are 'admin', 'manajemen', 'dosen'"),
], userController.createUserBatch)

router.put('/', authorize(['admin', 'manajemen', 'dosen']),
    handleFileUpload, [
    query('uid').isString().trim().toLowerCase().withMessage("This key is optional and it's string"),
    body('nip').isString().optional().toLowerCase().trim().withMessage("This key is optional and it's string"),
    body('nip').optional().notEmpty().withMessage("This key should not be empty"),
    body('password').isString().optional().trim().withMessage("This key is optional and it's string"),
    body('password').optional().notEmpty().withMessage("This key should not be empty"),
    body('nama').isString().optional().trim().withMessage("This key is optional and it's string"),
    body('nama').optional().notEmpty().withMessage("This key should not be empty"),
    body('role').isIn(['admin', 'manajemen', 'dosen']).optional().toLowerCase().trim().withMessage("Role are 'admin', 'manajemen', 'dosen'"),
    body('role').optional().notEmpty().withMessage("This key should not be empty. Role are 'admin', 'manajemen', 'dosen'"),
    body('email').isEmail().optional().trim().withMessage("This key is optional and it's email"),
    body('email').optional().notEmpty().withMessage("This key should not be empty"),
], userController.updateUser);

router.delete('/', authorize(['admin']), [
    query('uid').isString().trim().toLowerCase().withMessage("This key is required and it's string"),
    query('uid').notEmpty().withMessage("This key should not be empty")
],
    userController.deleteUser
)

export default router;