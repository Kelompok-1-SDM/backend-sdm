import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as tipeKegiatanServices from '../services/tipeKegiatanService'

export async function fetchTipeKegiatan(req: Request, res: Response) {
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

    const { uid: uidTipeKegiatan, is_jti: isJti } = req.query
    let data: any

    try {
        if (uidTipeKegiatan) {
            data = await tipeKegiatanServices.fetchTipeKegiatan(uidTipeKegiatan as string)
        } else if (isJti != null) {
            data = await tipeKegiatanServices.fetchAllTipeKegiatan(Boolean(isJti))
        } else {
            data = await tipeKegiatanServices.fetchAllTipeKegiatan()
        }

        if (data === "kegiatan_is_not_found") {
            res.status(404).json(createResponse(false, null, "Kegiatan not found"))
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

export async function createTipeKegiatan(req: Request, res: Response) {
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

    const { nama_tipe_kegiatan: tipeKegiatan, is_jti: isJti } = req.body

    try {
        const data = await tipeKegiatanServices.createTipeKegiatan({ tipeKegiatan, isJti })
        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('duplicate')) {
                res.status(422).json(createResponse(
                    false,
                    null,
                    "TipeKegiatan is duplicated"
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

};

export async function updateTipeKegiatan(req: Request, res: Response) {
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

    const { nama_tipe_kegiatan: tipeKegiatan, is_jti: isJti } = req.body
    const { uid } = req.query

    try {
        const data = await tipeKegiatanServices.updateTipeKegiatan(uid as string, { tipeKegiatan, isJti })
        if (data === "tipekegiatan_is_not_found") {
            res.status(404).json(createResponse(false, null, "TipeKegiatan not found"))
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

    const { uid } = req.query

    try {
        const data = await tipeKegiatanServices.deleteTipeKegiatan(uid as string)

        if (data === "tipekegiatan_is_not_found") {
            res.status(404).json(createResponse(false, null, "TipeKegiatan not found"))
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