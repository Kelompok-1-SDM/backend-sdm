import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as tokenService from "../services/tokenService"

export async function login(req: Request, res: Response): Promise<void> {
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

    const { nip, password } = req.body;

    try {
        const data: any = await tokenService.login(nip, password);

        switch (data) {
            case "user_is_not_found":
                res.status(404).json(createResponse(
                    false,
                    null,
                    "User is not found"
                ));
                break;

            case "wrong_password":
                res.status(401).json(createResponse(
                    false,
                    null,
                    "Wrong password"
                ));
                break;

            default:
                res.status(200).json(createResponse(
                    true,
                    data,
                    "OK"
                ));
                break;
        }
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