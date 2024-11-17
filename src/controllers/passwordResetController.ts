import { Request, Response } from 'express';
import { requestPasswordReset, validateResetToken, resetPassword } from '../services/passwordResetService';
import { validationResult } from 'express-validator';
import { createResponse } from '../utils/utils';

export async function handleRequestReset(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    try {
        const { nip } = req.body;
        const success = await requestPasswordReset(nip);
        if (!success) {
            res.status(404).json(createResponse(
                false,
                null,
                "User not found"
            ));
            return
        }

        res.status(200).json(createResponse(
            true,
            null,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : null,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
}

export async function handleResetPassword(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    try {
        const { token, password } = req.body;
        const userId = await validateResetToken(token);
        if (!userId) {
            res.status(400).json(createResponse(
                false,
                null,
                'Invalid or expired token'
            ));
            return
        }
        await resetPassword(userId, password);

        res.status(200).json(createResponse(
            true,
            null,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : null,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
}
