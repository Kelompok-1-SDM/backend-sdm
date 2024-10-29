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

    const data: {} = await tokenService.login(nip, password);

    switch (data) {
        case "user_not_found":
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
                "Successfully logged in"
            ));
            break;
    }
}