import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as penugasanServices from '../services/penugasanService'
import { fetchUserJabatanInKegiatan } from '../models/penugasanModels';

export async function fetchPenugasanByKegiatan(req: Request, res: Response) {
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
        let { uid_kegiatan: uidKegiatan, uid_user: uidUser } = req.query

        if (uidUser === "") {
            uidUser = req.user?.userId
        }

        const data = await penugasanServices.fetchPenugasanOnKegiatan(uidKegiatan as string, uidUser as string)

        if (data === "penugasan_is_not_found") {
            res.status(404).json(createResponse(false, null, "Kegiatan not found"))
        } else {
            res.status(200).json(createResponse(
                true,
                data,
                "OK"
            ));
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

        if (req.user?.role === 'dosen') {
            const wasAllowed = await fetchUserJabatanInKegiatan(uidKegiatan as string, req.user!.userId as string)
            if (!wasAllowed) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not allowed to do this"
                ));
                return
            }

            if (wasAllowed.isJti) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not allowed to do this | You ca'nt edit kegiatan jti"
                ));
                return
            }


            if (!wasAllowed.isPic) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not PIC, or higher role"
                ));
                return
            }
        }

        const data = await penugasanServices.tugaskanKegiatan(uidKegiatan as string, listUserDitugaskan)

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('references `users`')) {
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
                    process.env.NODE_ENV === 'development' ? err.stack : null,
                    err.message || 'An unknown error occurred!'
                ))
                return
            }
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
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

        if (req.user?.role === 'dosen') {
            const wasAllowed = await fetchUserJabatanInKegiatan(uidKegiatan as string, req.user!.userId as string)
            if (!wasAllowed) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not allowed to do this"
                ));
                return
            }

            if (wasAllowed.isJti) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not allowed to do this | You ca'nt edit kegiatan jti"
                ));
                return
            }


            if (!wasAllowed.isPic) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not PIC, or higher role"
                ));
                return
            }
        }

        const data = await penugasanServices.updatePenugasanKegiatan(uidKegiatan as string, listUserDitugaskan)

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('references `users`')) {
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
                    process.env.NODE_ENV === 'development' ? err.stack : null,
                    err.message || 'An unknown error occurred!'
                ))
                return
            }
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
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

        if (req.user?.role === 'dosen') {
            const wasAllowed = await fetchUserJabatanInKegiatan(uidKegiatan as string, req.user!.userId as string)
            if (!wasAllowed) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not allowed to do this"
                ));
                return
            }

            if (wasAllowed.isJti) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not allowed to do this | You ca'nt edit kegiatan jti"
                ));
                return
            }


            if (!wasAllowed.isPic) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not PIC, or higher role"
                ));
                return
            }
        }

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