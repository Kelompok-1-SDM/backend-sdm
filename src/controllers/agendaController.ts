import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as agendaServices from '../services/agendaService'
import { fetchUserInAgenda, fetchUserJabatanInKegiatan } from '../models/penugasanModels'

export async function fetchAgenda(req: Request, res: Response) {
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

    const { uid: uidAgenda } = req.query

    try {
        const data = await agendaServices.fetchAgenda(uidAgenda as string)

        if (data === "agenda_is_not_found") {
            res.status(404).json(createResponse(false, null, "Agenda not found"))
            return
        } else {
            let wasMePic;
            if (req.user?.role === 'dosen') {
                const wasAllowed = await fetchUserJabatanInKegiatan(data.kegiatanId, req.user!.userId as string)
                const wasInAgenda = await fetchUserInAgenda(uidAgenda as string, req.user!.userId as string)
                wasMePic = wasAllowed.isPic
                if (!wasAllowed || !wasInAgenda || wasMePic) {
                    res.status(401).json(createResponse(
                        false,
                        null,
                        "You're not allowed to do this"
                    ));
                    return
                }


            }

            res.status(200).json(createResponse(
                true,
                { ...data, wasMePic },
                "OK"
            ));
            return
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

export async function createAgenda(req: Request, res: Response) {
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
    let { jadwal_agenda: jadwalAgenda, nama_agenda: namaAgenda, deskripsi_agenda: deskripsiAgenda, is_done: isDone, list_uid_user_kegiatan: listUserKegiatan } = req.body

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

        if (!wasAllowed.isPic) {
            res.status(401).json(createResponse(
                false,
                null,
                "You're not PIC, or higher role"
            ));
            return
        }
    }

    try {
        const data = await agendaServices.createAgenda({ kegiatanId: (uidKegiatan as string), jadwalAgenda, namaAgenda, deskripsiAgenda, isDone }, listUserKegiatan)

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
            } else if (err.message.toLowerCase().includes('references `users_to_kegiatan`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "User to Kegiatan uid was not found, bad relationship"
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

export async function createProgressAgenda(req: Request, res: Response) {
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
        const { uid_agenda: uidAgenda } = req.query
        const { deskripsi_progress: deskripsiProgress } = req.body
        const files = req.files as Express.Multer.File[];

        const agenda = await agendaServices.fetchAgenda(uidAgenda as string);
        if (req.user?.role === 'dosen' && agenda != 'agenda_is_not_found') {
            const wasAllowed = await fetchUserJabatanInKegiatan(agenda.kegiatanId as string, req.user!.userId as string)
            const wasInAgenda = await fetchUserInAgenda(uidAgenda as string, req.user!.userId as string)
            if (!wasAllowed || !wasInAgenda) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not allowed to do this"
                ));
                return
            }
        }

        if (!files || files.length === 0) {
            res.status(400).json(createResponse(
                false,
                null,
                "Key files is missing or not uploaded(minimum 1, maximum 10)"
            ));
            return
        }

        const data = await agendaServices.createProgressAgenda({ agendaId: uidAgenda as string, deskripsiProgress: deskripsiProgress as string }, files)
        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('references `agenda`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "Agenda uid was not found, bad relationship"
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

export async function updateAgenda(req: Request, res: Response) {
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

    const { uid: uidAgenda } = req.query
    let { kegiatan_id: uidKegiatan, jadwal_agenda: jadwalAgenda, nama_agenda: namaAgenda, deskripsi_agenda: deskripsiAgenda, is_done: isDone, list_uid_user_kegiatan: listUserKegiatan } = req.body

    const agenda = await agendaServices.fetchAgenda(uidAgenda as string);
    if (req.user?.role === 'dosen' && agenda != 'agenda_is_not_found') {
        const wasAllowed = await fetchUserJabatanInKegiatan(agenda.kegiatanId as string, req.user!.userId as string)
        if (!wasAllowed) {
            res.status(401).json(createResponse(
                false,
                null,
                "You're not allowed to do this"
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

    try {
        const data = await agendaServices.updateAgenda(uidAgenda as string, { kegiatanId: (uidKegiatan as string), jadwalAgenda, namaAgenda, deskripsiAgenda, isDone }, listUserKegiatan)

        if (data === 'agenda_is_not_found') {
            res.status(404).json(createResponse(
                false,
                null,
                "Agenda is not found"
            ));
            return
        }

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
            } else if (err.message.toLowerCase().includes('references `users_to_kegiatan`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "User to Kegiatan uid was not found, bad relationship"
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

export async function updateProgressAgenda(req: Request, res: Response) {
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
        const { uid: uidProgress } = req.query
        const { deskripsi_progress: deskripsiProgress, uid_agenda: uidAgenda } = req.body
        const files = req.files as Express.Multer.File[];

        const agenda = await agendaServices.fetchAgenda(uidAgenda as string);
        if (req.user?.role === 'dosen' && agenda != 'agenda_is_not_found') {
            const wasAllowed = await fetchUserJabatanInKegiatan(agenda.kegiatanId as string, req.user!.userId as string)
            const wasInAgenda = await fetchUserInAgenda(uidAgenda as string, req.user!.userId as string)
            if (!wasAllowed || !wasInAgenda) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "You're not allowed to do this"
                ));
                return
            }
        }

        const data = await agendaServices.updateProgressAgenda(uidProgress as string, { agendaId: uidAgenda as string, deskripsiProgress: deskripsiProgress as string }, files)
        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('references `agenda`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "Agenda uid was not found, bad relationship"
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

export async function deleteAgenda(req: Request, res: Response) {
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

    const { uid: uidAgenda } = req.query

    const agenda = await agendaServices.fetchAgenda(uidAgenda as string);
    if (req.user?.role === 'dosen' && agenda != 'agenda_is_not_found') {
        const wasAllowed = await fetchUserJabatanInKegiatan(agenda.kegiatanId as string, req.user!.userId as string)
        if (!wasAllowed) {
            res.status(401).json(createResponse(
                false,
                null,
                "You're not allowed to do this"
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

    try {
        const data = await agendaServices.deleteAgenda(uidAgenda as string)

        if (data === "agenda_is_not_found") {
            res.status(404).json(createResponse(false, null, "Agenda not found"))
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

export async function deleteUserFromAgenda(req: Request, res: Response) {
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

    const { uid: uidAgenda, uid_user_kegiatan: uidUserKegiatan } = req.query

    const agenda = await agendaServices.fetchAgenda(uidAgenda as string);
    if (req.user?.role === 'dosen' && agenda != 'agenda_is_not_found') {
        const wasAllowed = await fetchUserJabatanInKegiatan(agenda.kegiatanId as string, req.user!.userId as string)
        if (!wasAllowed) {
            res.status(401).json(createResponse(
                false,
                null,
                "You're not allowed to do this"
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

    try {
        const data = await agendaServices.deleteUserFromAgenda(uidAgenda as string, uidUserKegiatan as string)

        if (data === "agenda_is_not_found") {
            res.status(404).json(createResponse(false, null, "Agenda not found"))
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

export async function deleteProgressAgenda(req: Request, res: Response) {
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

    const { uid: uidProgress } = req.query

    try {
        const data = await agendaServices.deleteProgress(uidProgress as string)

        if (data === "progress_is_not_found") {
            res.status(404).json(createResponse(false, null, "Progress not found"))
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

export async function deleteAttachmentProgress(req: Request, res: Response) {
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

    const { uid: uidProgress, uid_attachment: uidAttachment } = req.query

    try {
        const data = await agendaServices.deletAttachmentProgress(uidProgress as string, uidAttachment as string)

        if (data === "progress_is_not_found") {
            res.status(404).json(createResponse(false, null, "Progress not found"))
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