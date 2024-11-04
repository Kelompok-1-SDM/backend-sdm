import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as penugasanServices from '../services/penugasanService'


export async function tugaskanKegiatan(req: Request, res: Response) {
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
        const { list_user_ditugaskan: listUserDitugaskan } = req.body
        const { uid_kegiatan: uidKegiatan } = req.query

        const data = await penugasanServices.tugaskanKegiatan(uidKegiatan as string, listUserDitugaskan)

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('references `user`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "One of user uid of not found, bad relationship"
                ))
                return
            } else if (err.message.toLowerCase().includes('references `kegiatan`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "Kegiatan uid was not found, bad relationship"
                ))
                return
            } else {
                res.status(500).json(createResponse(
                    false,
                    process.env.NODE_ENV === 'development' ? err.stack : undefined,
                    err.message || 'An unknown error occurred!'
                ))
                return
            }
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            undefined,
            "Mbuh mas"
        ))
    }
}

export async function updatePenugasanKegiatan(req: Request, res: Response) {
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
        const { list_user_ditugaskan: listUserDitugaskan } = req.body
        const { uid_kegiatan: uidKegiatan } = req.query

        const data = await penugasanServices.updatePenugasanKegiatan(uidKegiatan as string, listUserDitugaskan)

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('references `user`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "One of user uid of not found, bad relationship"
                ))
                return
            } else if (err.message.toLowerCase().includes('references `kegiatan`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "Kegiatan uid was not found, bad relationship"
                ))
                return
            } else {
                res.status(500).json(createResponse(
                    false,
                    process.env.NODE_ENV === 'development' ? err.stack : undefined,
                    err.message || 'An unknown error occurred!'
                ))
                return
            }
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            undefined,
            "Mbuh mas"
        ))
    }
}

export async function deletePenugasan(req: Request, res: Response) {
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

    const { uid_kegiatan: uidKegiatan, uid_user: uidUser } = req.query

    try {
        const data = await penugasanServices.deletePenugasan(uidKegiatan as string, uidUser as string)

        if (data === "kegiatan_is_not_found") {
            res.status(404).json(createResponse(false, null, "Kegiatan not found"))
            return
        } else if (data === "user_is_not_found") {
            res.status(404).json(createResponse(false, null, "User is not found"))
            return
        }

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : undefined,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            undefined,
            "Mbuh mas"
        ))
    }
}