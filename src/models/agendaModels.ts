import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { agendaKegiatans, agendaToUsersKegiatans, progressAgenda, progressAgendaToProgressAttachment, progressAttachments } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";

export type AgendaKegiatanDataType = typeof agendaKegiatans.$inferInsert
export type ProgressAgendaDataType = typeof progressAgenda.$inferInsert
export type ProgressAttachmentDataType = typeof progressAttachments.$inferInsert
export const agendaColumns = getTableColumns(agendaKegiatans)
export const progressColumns = getTableColumns(progressAgenda)
export const attachColumns = getTableColumns(progressAttachments)

//TODO Improve at query peformance
export async function fetchProgress(uidProgress: string) {
    const prepared = db.query.progressAgenda.findFirst({
        where: ((progressAgenda, { eq }) => eq(progressAgenda.progressId, sql.placeholder('uidProgress'))),
        with: {
            progressAttachment: {
                with: {
                    attachment: true
                }
            },
        }
    }).prepare()

    const res = await prepared.execute({ uidProgress })

    return res ? {
        ...res, // Keep the agendaKegiatans (agenda) data
        attachments: res?.progressAttachment.map(it => (it.attachment)), // Extract and flatten attachments
        progressAttachment: undefined
    } : undefined
}

// Internal only
export async function fetchProgressAttach(hash: string) {
    const prepared = db.select()
        .from(progressAttachments)
        .where(
            eq(progressAttachments.hash, sql.placeholder('hash'))
        )
        .prepare()

    const [res] = await prepared.execute({ hash })
    return res
}

export async function fetchAgendaByKegiatan(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            agenda: {
                orderBy: (agendaKegiatans, { desc }) => [desc(agendaKegiatans.jadwalAgenda)],
                with: {
                    agendaToUser: {
                        with: {
                            userToKegiatans: {
                                with: {
                                    users: {
                                        columns: {
                                            password: false,
                                            createdAt: false,
                                            updatedAt: false
                                        }
                                    },
                                    jabatans: true
                                }
                            }
                        }
                    }
                }
            }
        }
    }).prepare()

    let dat: any = await prepared.execute({ uidKegiatan })

    dat = dat?.agenda.map((it: any) => {
        return {
            ...it,
            users: it.agendaToUser.map((ap: any) => {
                return {
                    ...ap.userToKegiatans.users,
                    namaJabatan: ap.userToKegiatans.jabatans.namaJabatan,
                    isPic: ap.userToKegiatans.jabatans.isPic
                }
            }),

            agendaToUser: undefined
        }
    })

    return dat
}

export async function fetchAgenda(uidAgenda: string) {
    const prepared = db.query.agendaKegiatans.findFirst({
        where: ((agendaKegiatans, { eq }) => eq(agendaKegiatans.agendaId, sql.placeholder('uidAgenda'))),
        with: {
            progress: {
                orderBy: ((progressAgenda, { desc }) => [desc(progressAgenda.createdAt)]),
                with: {
                    progressAttachment: {
                        with: {
                            attachment: true
                        }
                    }
                }
            },
            agendaToUser: {
                columns: {
                    userToKegiatanId: true
                },
                with: {
                    userToKegiatans: {
                        columns: {},
                        with: {
                            users: {
                                columns: {
                                    password: false
                                }
                            }
                        }
                    }
                }
            }
        }
    }).prepare()

    const res = await prepared.execute({ uidAgenda })

    return res ? {
        ...res, // Keep the agendaKegiatans (agenda) data
        progress: res?.progress.map(progress => ({
            ...progress, // Keep progress data
            attachments: progress.progressAttachment.map(it => (it.attachment)), // Extract and flatten attachments
            progressAttachment: undefined
        })),
        users: res?.agendaToUser.map(it => ({
            userToKegiatanId: it.userToKegiatanId,
            ...it.userToKegiatans.users
        })),

        agendaToUser: undefined
    } : undefined
}

// internal only
export async function fetchAgendaOnlyWithProgress(uidAgenda: string) {
    const prepared = db.query.agendaKegiatans.findFirst({
        where: ((agendaKegiatans, { eq }) => eq(agendaKegiatans.agendaId, sql.placeholder('uidAgenda'))),
        with: {
            progress: {
                orderBy: ((progressAgenda, { desc }) => [desc(progressAgenda.createdAt)]),
            }
        }
    }).prepare()

    return await prepared.execute({ uidAgenda })
}

export async function createProgressAgenda(dataProgress: ProgressAgendaDataType, dataAttachment?: ProgressAttachmentDataType[]) {
    await db.transaction(async (tx) => {
        // Insert into progressAgenda and return the generated progressId
        const [prog] = await tx.insert(progressAgenda)
            .values(addTimestamps(dataProgress)) // Apply timestamps here
            .$returningId(); // Get inserted progressId

        if (dataAttachment) {
            // Process attachments in batches
            for (let i = 0; i < dataAttachment.length; i += batchQuerySize) {
                let batch = dataAttachment.slice(i, i + batchQuerySize);

                // Insert new attachments if they don't have attachmentId
                const newAttachments = batch.filter(dat => !dat.attachmentId);
                if (newAttachments.length > 0) {
                    const insertedAttachments = await tx.insert(progressAttachments)
                        // Wrap addTimestamps in a function to avoid passing index and array
                        .values(newAttachments.map(dat => addTimestamps(dat))) // Apply timestamps to each new attachment
                        .$returningId(); // Return inserted IDs

                    // Update the batch with the new attachment IDs
                    let apa = 0
                    batch.forEach((dat, _) => {
                        if (!dat.attachmentId) {
                            dat.attachmentId = insertedAttachments[apa].attachmentId;
                        }
                        apa++
                    });
                }

                // Link progressId and attachmentId in progressAgendaToProgressAttachment
                await tx.insert(progressAgendaToProgressAttachment)
                    .values(batch.map(dat => addTimestamps({
                        progressId: prog.progressId,
                        attachmentId: dat.attachmentId
                    }))).onDuplicateKeyUpdate({ set: { progressId: sql`values(${progressAgendaToProgressAttachment.progressId})` } });
            }
        }
    });

    return await fetchAgenda(dataProgress.agendaId)
}

export async function createAgenda(dataAgenda: AgendaKegiatanDataType, listUiduserKegiatan?: string[]) {
    let id: any
    await db.transaction(async (tx) => {
        [id] = await tx.insert(agendaKegiatans).values(addTimestamps(dataAgenda)).$returningId()

        if (listUiduserKegiatan) {
            const what = listUiduserKegiatan.map((it) => {
                return addTimestamps({
                    agendaId: id.agendaId,
                    userToKegiatanId: it
                })
            })
            await tx.insert(agendaToUsersKegiatans).values(addTimestamps(what))
        }

    })

    return await fetchAgenda(id.agendaId)
}

export async function updateAgenda(uidAgenda: string, dataAgenda: Partial<AgendaKegiatanDataType>, listUiduserKegiatan?: string[]) {
    await db.update(agendaKegiatans)
        .set(addTimestamps(dataAgenda, true))
        .where(eq(agendaKegiatans.agendaId, uidAgenda))

    if (listUiduserKegiatan) {
        const what = listUiduserKegiatan.map((it) => {
            return addTimestamps({
                agendaId: uidAgenda,
                userToKegiatanId: it
            })
        })
        await db.insert(agendaToUsersKegiatans).values(what).onDuplicateKeyUpdate({
            set: {
                agendaId: sql`values(${agendaToUsersKegiatans.agendaId})`,
                userToKegiatanId: sql`values(${agendaToUsersKegiatans.userToKegiatanId})`
            }
        })
    }

    return await fetchAgenda(uidAgenda)
}

export async function updateProgress(uidProgress: string, dataProgress: Partial<ProgressAgendaDataType>, dataAttachment?: ProgressAttachmentDataType[]) {
    await db.transaction(async (tx) => {
        await tx.update(progressAgenda)
            .set(addTimestamps(dataProgress, true))
            .where(
                eq(progressAgenda.progressId, uidProgress)
            )

        if (dataAttachment) {
            for (let i = 0; i < dataAttachment.length; i += batchQuerySize) {
                let batch: any[] = dataAttachment.slice(i, i + batchQuerySize);

                // Insert new attachments if they don't have attachmentId
                const newAttachments = batch.filter(dat => !dat.attachmentId);
                if (newAttachments.length > 0) {
                    const insertedAttachments = await tx.insert(progressAttachments)
                        // Wrap addTimestamps in a function to avoid passing index and array
                        .values(newAttachments.map(dat => addTimestamps(dat))) // Apply timestamps to each new attachment
                        .$returningId(); // Return inserted IDs

                    // Update the batch with the new attachment IDs
                    batch.forEach((dat, _) => {
                        if (!dat.attachmentId) {
                            const at = insertedAttachments.shift()
                            dat.attachmentId = at!.attachmentId;
                        }
                    });
                }

                // Link progressId and attachmentId in progressAgendaToProgressAttachment
                await tx.insert(progressAgendaToProgressAttachment)
                    .values(
                        batch.map(dat => addTimestamps({
                            progressId: uidProgress,
                            attachmentId: dat.attachmentId
                        })))
                    .onDuplicateKeyUpdate({ set: { progressId: sql`values(${progressAgendaToProgressAttachment.progressId})` } });
            }
        }
    })

    const prepared = db.select({ agendaId: progressAgenda.agendaId })
        .from(progressAgenda)
        .where(eq(progressAgenda.progressId, sql.placeholder('uidProgress')))
        .prepare()
    const [data] = await prepared.execute({ uidProgress })
    return await fetchAgenda(data.agendaId)
}

export async function deleteUserFromAgenda(uidAgenda: string, uidUserKegiatan: string) {
    await db.delete(agendaToUsersKegiatans).where(
        and(
            eq(agendaToUsersKegiatans.userToKegiatanId, uidUserKegiatan),
            eq(agendaToUsersKegiatans.agendaId, uidAgenda)
        )
    )

    return await fetchAgenda(uidAgenda)
}

export async function deleteAgenda(uidAgenda: string) {
    const temp = await fetchAgendaOnlyWithProgress(uidAgenda)
    await db.delete(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))

    return temp
}

export async function deleteProgress(uidProgress: string) {
    const dat = await fetchProgress(uidProgress)
    await db.delete(progressAgenda).where(eq(progressAgenda.progressId, uidProgress))

    return dat
}

export async function deletAttachmentProgress(uidProgress: string, uidAttachment: string) {
    await db.delete(progressAgendaToProgressAttachment)
        .where(
            and(
                eq(progressAgendaToProgressAttachment.progressId, uidProgress),
                eq(progressAgendaToProgressAttachment.attachmentId, uidAttachment)
            )
        )

    return await fetchProgress(uidProgress)
}