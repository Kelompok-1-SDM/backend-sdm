import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as userService from '../services/usersServices'

export async function fetchAllUser(req: Request, res: Response) {
    try {
        const data = await userService.fetchAllUsers()
        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(createResponse(
                false,
                null,
                error.message
            ));
        }
    }
}

export async function createUser(req: Request, res: Response) {
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
        const { nip, password, nama, role, email, profile_image: profileImage } = req.body

        const data = await userService.createUser({ nip, password, nama, role, email, profileImage })
        res.status(200).json(createResponse(
            true,
            data,
            "User successfully created"
        ));
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(createResponse(
                false,
                null,
                error.message
            ));
        }
    }
};