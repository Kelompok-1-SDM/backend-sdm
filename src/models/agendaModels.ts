import { desc, eq, getTableColumns, sql } from "drizzle-orm";
import { agendaKegiatans, kegiatans, progressAgenda, progressAgendaToProgressAttachment, progressAttachments } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";

export type AgendaKegiatanDataType = typeof agendaKegiatans.$inferInsert
export type ProgressAgendaDataType = typeof progressAgenda.$inferInsert
export type ProgressAttachmentDataType = typeof progressAttachments.$inferInsert
export const agendaColumns = getTableColumns(agendaKegiatans)
export const attachColumns = getTableColumns(progressAttachments)


// export async function fetchAgendaOnly(uidAgenda: string) {
//     const [temp] = await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda)).orderBy(desc(agendaKegiatans.updatedAt))
//     return temp
// }

export async function fetchProgressOnly(uidProgress: string) {
    const [temp] = await db.select().from(progressAgenda).where(eq(progressAgenda.progressId, uidProgress))
    return temp
}

export async function fetchProgressAttach(hash: string) {
    const [temp] = await db.select().from(progressAttachments).where(eq(progressAttachments.hash, hash))
    return temp
}

export async function fetchAgendaByKegiatan(uidKegiatan: string) {
    const [kgData] = await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))
    const agendaData = await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.kegiatanId, uidKegiatan)).orderBy(desc(agendaKegiatans.jadwalAgenda))

    return {
        ...kgData,
        agenda: agendaData
    }
}

export async function fetchAgenda(uidAgenda: string) {
    const [agendaData] = await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))
    const progress = await db.select().from(progressAgenda).where(eq(progressAgenda.agendaId, uidAgenda))

    const updatedProgress = await Promise.all(
        progress.map(async (dat) => {
            const apa = await db
                .select(attachColumns)
                .from(progressAgendaToProgressAttachment)
                .rightJoin(progressAttachments, eq(progressAttachments.attachmentId, progressAgendaToProgressAttachment.attachmentId))
                .where(eq(progressAgendaToProgressAttachment.progressId, dat.progressId));

            return {
                ...dat,
                attachment: apa
            };
        })
    );

    return {
        ...agendaData,
        progress: updatedProgress
    }
}

export async function createProgressAgenda(dataProgress: ProgressAgendaDataType, dataAttachment?: ProgressAttachmentDataType[]) {
    await db.transaction(async (tx) => {
        const [prog] = await tx.insert(progressAgenda).values(addTimestamps(dataProgress)).$returningId()

        if (dataAttachment) {
            for (let i = 0; i < dataAttachment.length; i += batchQuerySize) {
                let batch: any[] = dataAttachment.slice(i, i + batchQuerySize);
                await Promise.all(batch.map(async (dat) => {
                    if (!dat.attachmentId) {
                        const [attach] = await tx.insert(progressAttachments).values(addTimestamps(dat)).$returningId()
                        dat.attachmentId = attach.attachmentId
                    }
                    await tx.insert(progressAgendaToProgressAttachment).values(addTimestamps({
                        progressId: prog.progressId,
                        attachmentId: dat.attachmentId,
                    }))
                }))
            }
        }
    })

    const data = await fetchAgenda(dataProgress.agendaId)
    return data
}

export async function createAgenda(dataAgenda: AgendaKegiatanDataType) {
    await db.insert(agendaKegiatans).values(addTimestamps(dataAgenda))

    const data = await fetchAgendaByKegiatan(dataAgenda.kegiatanId)
    return data
}

export async function updateAgenda(uidAgenda: string, dataAgenda: AgendaKegiatanDataType) {
    await db.update(agendaKegiatans).set(addTimestamps(dataAgenda, true)).where(eq(agendaKegiatans.agendaId, uidAgenda))

    const data = await fetchAgendaByKegiatan(dataAgenda.kegiatanId)
    return data
}

export async function updateProgress(uidProgress: string, dataProgress: ProgressAgendaDataType, dataAttachment?: ProgressAttachmentDataType[]) {
    await db.transaction(async (tx) => {
        await tx.update(progressAgenda).set(addTimestamps(dataProgress, true)).where(eq(progressAgenda.progressId, uidProgress))

        if (dataAttachment) {
            for (let i = 0; i < dataAttachment.length; i += batchQuerySize) {
                let batch: any[] = dataAttachment.slice(i, i + batchQuerySize);
                await Promise.all(batch.map(async (dat) => {
                    if (!dat.attachmentId) {
                        const [attach] = await tx.insert(progressAttachments).values(addTimestamps(dat)).$returningId()
                        dat.attachmentId = attach.attachmentId
                    }
                    await tx.insert(progressAgendaToProgressAttachment).values(addTimestamps({
                        progressId: uidProgress,
                        attachmentId: dat.attachmentId,
                    })).onDuplicateKeyUpdate({ set: { progressId: sql`progress_id` } })
                }))
            }
        }
    })

    return await fetchAgenda(dataProgress.agendaId)
}

export async function deleteAgenda(uidAgenda: string) {
    const [temp] = await db.select({ kegiatanId: agendaKegiatans.kegiatanId }).from(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))
    await db.delete(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))

    return await fetchAgendaByKegiatan(temp.kegiatanId)
}

export async function deleteProgress(uidProgress: string) {
    const [dat] = await db.select({ agendaId: progressAgenda.agendaId }).from(progressAgenda).where(eq(progressAgenda.progressId, uidProgress))
    await db.delete(progressAgenda).where(eq(progressAgenda.agendaId, uidProgress))

    return await fetchAgenda(dat.agendaId)
}