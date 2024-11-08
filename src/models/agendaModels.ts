import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import { agendaKegiatans, kegiatans, progressAgenda, progressAgendaToProgressAttachment, progressAttachments } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";

export type AgendaKegiatanDataType = typeof agendaKegiatans.$inferInsert
export type ProgressAgendaDataType = typeof progressAgenda.$inferInsert
export type ProgressAttachmentDataType = typeof progressAttachments.$inferInsert
export const agendaColumns = getTableColumns(agendaKegiatans)
export const progressColumns = getTableColumns(progressAgenda)
export const attachColumns = getTableColumns(progressAttachments)

export async function fetchProgress(uidProgress: string) {
    const prepared = db.query.progressAgenda.findFirst({
        where: ((progressAgenda, { eq }) => eq(progressAgenda.progressId, sql.placeholder('uidProgress'))),
        with: {
            progressAgendaToProgressAttachment: {
                with: {
                    attachment: true
                }
            }
        }
    }).prepare()

    const res = await prepared.execute({ uidProgress })

    return {
        ...res, // Keep the agendaKegiatans (agenda) data
        attachments: res?.progressAgendaToProgressAttachment.map(pa => pa.attachment), // Extract and flatten attachments
        progressAgendaToProgressAttachment: undefined
    };
}

// Internal only
export async function fetchProgressAttach(hash: string) {
    const prepared = db.query.progressAttachments.findFirst({
        where: ((progressAttachments, { eq }) => eq(progressAttachments.hash, sql.placeholder('hash')))
    }).prepare()

    return await prepared.execute({ hash })
}

export async function fetchAgendaByKegiatan(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            agendaKegiatans: {
                orderBy: (agendaKegiatans, { desc }) => [desc(agendaKegiatans.jadwalAgenda)]
            }
        }
    }).prepare()

    return await prepared.execute({ uidKegiatan })
}

export async function fetchAgenda(uidAgenda: string) {
    const prepared = db.query.agendaKegiatans.findFirst({
        where: ((agendaKegiatans, { eq }) => eq(agendaKegiatans.agendaId, sql.placeholder('uidAgenda'))),
        with: {
            progress: {
                orderBy: ((progressAgenda, { desc }) => [desc(progressAgenda.createdAt)]),
                with: {
                    progressAgendaToProgressAttachment: {
                        with: {
                            attachment: true
                        }
                    }
                }
            }
        }
    }).prepare()

    const res = await prepared.execute({ uidAgenda })

    return {
        ...res, // Keep the agendaKegiatans (agenda) data
        progress: res?.progress.map(progress => ({
            ...progress, // Keep progress data
            attachments: progress.progressAgendaToProgressAttachment.map(pa => pa.attachment), // Extract and flatten attachments
            progressAgendaToProgressAttachment: undefined
        }))
    };
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

export async function createAgenda(dataAgenda: AgendaKegiatanDataType) {
    await db.insert(agendaKegiatans).values(addTimestamps(dataAgenda))

    return await fetchAgendaByKegiatan(dataAgenda.kegiatanId)
}

export async function updateAgenda(uidAgenda: string, dataAgenda: AgendaKegiatanDataType) {
    await db.update(agendaKegiatans).set(addTimestamps(dataAgenda, true)).where(eq(agendaKegiatans.agendaId, uidAgenda))

    return await fetchAgendaByKegiatan(dataAgenda.kegiatanId)
}

export async function updateProgress(uidProgress: string, dataProgress: ProgressAgendaDataType, dataAttachment?: ProgressAttachmentDataType[]) {
    await db.transaction(async (tx) => {
        await tx.update(progressAgenda).set(addTimestamps(dataProgress, true)).where(eq(progressAgenda.progressId, uidProgress))

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
                    .values(batch.map(dat => addTimestamps({
                        progressId: uidProgress,
                        attachmentId: dat.attachmentId
                    }))).onDuplicateKeyUpdate({ set: { progressId: sql`values(${progressAgendaToProgressAttachment.progressId})` } });
            }
        }
    })

    return await fetchAgenda(dataProgress.agendaId)
}

export async function deleteAgenda(uidAgenda: string) {
    const temp = await fetchAgendaOnlyWithProgress(uidAgenda)
    await db.delete(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))

    return temp
}

export async function deleteProgress(uidProgress: string) {
    const dat = await fetchProgress(uidProgress)
    await db.delete(progressAgenda).where(eq(progressAgenda.agendaId, uidProgress))

    return dat
}