import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as lampiranServices from '../services/lampiranService'
import { fetchUserRoleInKegiatan } from '../models/penugasanModels'
import { fetchLampiranByUid } from '../models/lampiranModels'

export async function createLampiran(req: Request, res: Response) {
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

    const { uid_kegiatan: uidKegiatan } = req.query
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        res.status(400).json(createResponse(
            false,
            null,
            "Key files is missing or not uploaded(minimum 1)"
        ));
        return
    }

    if (req.user.role === 'dosen') {
        const wasAllowed = await fetchUserRoleInKegiatan(uidKegiatan as string, req.user!.userId as string)
        if (!wasAllowed) {
            res.status(401).json(createResponse(
                false,
                null,
                "You're not allowed to do this"
            ));
            return
        }

        if (wasAllowed.role == 'anggota') {
            res.status(401).json(createResponse(
                false,
                null,
                "You're not PIC, or higher role"
            ));
            return
        }
    }

    try {
        const data = await lampiranServices.createLampiran(uidKegiatan as string, files)
        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('references `kegiatan`')) {
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

export async function deleteLampiran(req: Request, res: Response) {
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

    const { uid: uidLampiran } = req.query

    if (req.user.role === 'dosen') {
        const lampiran = await fetchLampiranByUid(uidLampiran as string)
        const wasAllowed = await fetchUserRoleInKegiatan(lampiran.kegiatanId as string, req.user!.userId as string)
        if (!wasAllowed) {
            res.status(401).json(createResponse(
                false,
                null,
                "You're not allowed to do this"
            ));
            return
        }

        if (wasAllowed.role == 'anggota') {
            res.status(401).json(createResponse(
                false,
                null,
                "You're not PIC, or higher role"
            ));
            return
        }
    }

    try {
        const data = await lampiranServices.deleteLampiran(uidLampiran as string)

        if (data === "lampiran_is_not_found") {
            res.status(404).json(createResponse(false, null, "Lampiran not found"))
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