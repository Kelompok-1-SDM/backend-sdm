import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as userService from '../services/usersServices'

export async function fetchUsers(req: Request, res: Response) {
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
        let { uid, role } = req.query
        let data: any

        if (uid) {
            data = await userService.fetchUserComplete(uid as string)
        } else if (role) {
            data = await userService.fetchUserByRole(role as 'admin' | 'manajemen' | 'dosen')
        } else {
            data = await userService.fetchAllUsers()
        }

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

export async function updateUser(req: Request, res: Response) {
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
        const { nip, password, nama, role, profile_image: profileImage } = req.body
        const { uid } = req.query

        if (req.user!.role !== 'admin' && req.user!.userId !== uid as string) {
            res.status(401).json(createResponse(
                false,
                null,
                "Method is not allowed"
            ));
        }

        const data = await userService.updateUser(uid as string, {
            nip,
            password,
            nama,
            role,
            profileImage
        })
        res.status(200).json(createResponse(
            true,
            data,
            "User successfully updated"
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

export async function deleteUser(req: Request, res: Response) {
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
        const { uid } = req.query

        const data = await userService.deleteUser(uid as string)
        res.status(200).json(createResponse(
            true,
            data,
            "User successfully deleted"
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