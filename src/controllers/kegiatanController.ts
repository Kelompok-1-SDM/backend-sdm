import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as kegiatanService from '../services/kegiatanService'


export async function fetchKegiatan(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input err",
            errors.array()
        ));
        return
    }

    let { uid_user: uidUser, uid: uidKegiatan, isDone, tanggal } = req.query
    let data: any

    if (uidUser === "") {
        uidUser = req.user?.userId
    }

    try {
        if (uidUser) {
            if (isDone || tanggal) {
                data = await kegiatanService.fetchKegiatanByUser(uidUser as string, Boolean(isDone), tanggal as string)
            }
            else {
                data = await kegiatanService.fetchKegiatanByUser(uidUser as string)
            }
        } else if (uidKegiatan) {
            data = await kegiatanService.fetchKegiatan(uidKegiatan as string)
        } else {
            data = await kegiatanService.fetchAllKegiatan()
        }

        if (data === "kegiatan_is_not_found") {
            res.status(404).json(createResponse(false, null, "Kegiatan not found"))
            return
        } else if (data === "user_is_not_found") {
            res.status(404).json(createResponse(false, null, "User not found"))
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

export async function createKegiatan(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input err",
            errors.array()
        ));
        return
    }

    try {
        const { judul_kegiatan: judul, tanggal_mulai: tanggalMulai, tanggal_akhir: tanggalAkhir, tipe_kegiatan: tipeKegiatan, lokasi, deskripsi, list_kompetensi: listKompetensi } = req.body

        const data = await kegiatanService.createKegiatan({ judul, tanggalMulai, tanggalAkhir, tipeKegiatan, lokasi, deskripsi }, listKompetensi)
        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('references `kompetensi`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "One of the kompetensi is not found, bad relationship"
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

export async function updateKegiatan(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input err",
            errors.array()
        ));
        return
    }

    try {
        const { judul_kegiatan: judul, tanggal_mulai: tanggalMulai, tanggal_akhir: tanggalAkhir, tipe_kegiatan: tipeKegiatan, lokasi, deskripsi, list_kompetensi: listKompetensi } = req.body
        const { uid: uidKegiatan } = req.query

        const data = await kegiatanService.updateKegiatan(uidKegiatan as string, { judul, tanggalMulai, tanggalAkhir, tipeKegiatan, lokasi, deskripsi }, listKompetensi)

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
            if (err.message.toLowerCase().includes('references `kompetensi`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "Kompetensi uid was not found, bad relationship"
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

export async function deleteKegiatan(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input err",
            errors.array()
        ));
        return
    }

    const { uid: uidKegiatan } = req.query

    try {
        const data = await kegiatanService.deleteKegiatan(uidKegiatan as string)

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


export async function deleteKompetensiKegiatan(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input err",
            errors.array()
        ));
        return
    }

    const { uid: uidKegiatan, uid_kompetensi: uidKompetensi } = req.query

    try {
        const data = await kegiatanService.deleteKompetensiKegiatan(uidKegiatan as string, uidKompetensi as string)

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