import express from 'express';
import * as tokenController from '../controllers/tokenController';
import { body } from 'express-validator';

const router = express.Router();

router.post('/login', [
    body('nip').isString().trim().toLowerCase(),
    body('password').isString().trim()
], tokenController.login);

export default router;
