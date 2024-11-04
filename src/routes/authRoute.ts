import express from 'express';
import * as tokenController from '../controllers/tokenController';
import { body } from 'express-validator';

const router = express.Router();

router.post('/login', [
    body('nip').isString().trim().toLowerCase().withMessage("This key is required and it's string"),
    body('nip').notEmpty().withMessage("This key should not be empty"),
    body('password').isString().trim().withMessage("This key is required and it's string"),
    body('password').notEmpty().withMessage("This key should not be empty"),
], tokenController.login);

export default router;
