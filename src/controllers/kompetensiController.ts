import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as kompetensiServices from '../services/kompetensiService'

export async function fetchKompetensi(req: Request, res: Response) {
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

    const { uid: uidKompetensi } = req.query
    let data: any

    try {
        if (uidKompetensi) {
            data = await kompetensiServices.fetchKompetensi(uidKompetensi as string)
        } else {
            data = await kompetensiServices.fetchAllKompetensi()
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

export async function createKompetensi(req: Request, res: Response) {
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

    const { nama_kompetensi: namaKompetensi } = req.body

    try {
        const data = await kompetensiServices.createKompetensi({ namaKompetensi })
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
                    undefined,
                    "Kompetensi is duplicated"
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

};

export async function updateKompetensi(req: Request, res: Response) {
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

    const { nama_kompetensi: namaKompetensi } = req.body
    const { uid } = req.query

    try {
        const data = await kompetensiServices.updateKompetensi(uid as string, { namaKompetensi })
        if (data === "kompetensi_is_not_found") {
            res.status(404).json(createResponse(false, null, "Kompetensi not found"))
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
        const data = await kompetensiServices.deleteKompetensi(uid as string)

        if (data === "kompetensi_is_not_found") {
            res.status(404).json(createResponse(false, null, "Kompetensi not found"))
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