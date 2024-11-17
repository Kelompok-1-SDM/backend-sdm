import express from 'express';
import * as tokenController from '../controllers/tokenController';
import { body } from 'express-validator';
import { handleRequestReset, handleResetPassword } from '../controllers/passwordResetController';

const router = express.Router();

router.post('/login', [
    body('nip').isString().trim().toLowerCase().withMessage("This key is required and it's string"),
    body('nip').notEmpty().withMessage("This key should not be empty"),
    body('password').isString().trim().withMessage("This key is required and it's string"),
    body('password').notEmpty().withMessage("This key should not be empty"),
], tokenController.login);

router.post('/request-reset', [
    body('nip').isString().trim().toLowerCase().withMessage("This key is required and it's string"),
    body('nip').notEmpty().withMessage("This key should not be empty"),
], handleRequestReset);
router.post('/reset-password', [
    body('token').isString().trim().toLowerCase().withMessage("This key is required and it's string"),
    body('token').notEmpty().withMessage("This key should not be empty"),
    body('password').isString().trim().toLowerCase().withMessage("This key is required and it's string"),
    body('password').notEmpty().withMessage("This key should not be empty"),
], handleResetPassword);

export default router;
