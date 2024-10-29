import { and, eq, isNull, sql } from "drizzle-orm";
import { agendaKegiatans, kegiatans, kompetensis, kompetensisToKegiatans, lampiranKegiatans, progressAgenda, progressAgendaToProgressAttachment, progressAttachments, users, usersToKegiatans } from "../db/schema";
import { addTimestamps, db } from "./utilsModel";

export type KegiatanDataType = typeof kegiatans.$inferInsert
export type LampiranDataType = typeof lampiranKegiatans.$inferInsert
export type AgendaKegiatanDataType = typeof agendaKegiatans.$inferInsert
export type ProgressAgendaDataType = typeof progressAgenda.$inferInsert
export type ProgressAttachmentDataType = typeof progressAttachments.$inferInsert

export type KegiatanToKompetensiDataType = typeof kompetensisToKegiatans.$inferInsert
export type UserToKegiatanDataType = typeof usersToKegiatans.$inferInsert

export async function fetchAllKegiatan() {
    return await db.select().from(kegiatans)
}

export async function fetchKegiatanByUser(uidUser: string) {
    return await db.select().from(users)
        // Join user_to_kegiatan
        .innerJoin(usersToKegiatans, eq(usersToKegiatans.userId, users.userId))
        .innerJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .where(eq(users.userId, uidUser))
}

export async function fetchKegiatanInfo(uidKegiatan: string, showAllData: boolean = false) {
    const [res] = await db.select().from(kegiatans)
        // Join user
        .innerJoin(usersToKegiatans, eq(usersToKegiatans.kegiatanId, kegiatans.kegiatanId))
        .innerJoin(users, eq(users.userId, usersToKegiatans.userId))
        //Join Lampiran Kegiatan
        .innerJoin(lampiranKegiatans, eq(lampiranKegiatans.kegiatanId, kegiatans.kegiatanId))
        // Join agenda
        .innerJoin(agendaKegiatans, eq(agendaKegiatans.kegiatanId, kegiatans.kegiatanId))
        // Join progress agenda
        .where(eq(kegiatans.kegiatanId, uidKegiatan))
    return res
}

export async function fetchProgress(uidProgress: string, showAllData: boolean = false) {
    return await db.select().from(agendaKegiatans)
        .innerJoin(progressAgenda, eq(progressAgenda.agendaId, agendaKegiatans.agendaId))
        //Join attachment
        .innerJoin(progressAgendaToProgressAttachment, eq(progressAgendaToProgressAttachment.progressId, progressAgenda.progressId))
        .innerJoin(progressAttachments, eq(progressAttachments.attachmentId, progressAgendaToProgressAttachment.attachmentId))
        .where(eq(agendaKegiatans.kegiatanId, uidProgress))
}

export async function createKegiatan(kegiatanData: KegiatanDataType, listKompetensiUid: string[]) {
    let idKegiatan;

    await db.transaction(async (tx) => {
        [idKegiatan] = await tx.insert(kegiatans).values(addTimestamps(kegiatanData)).$returningId()

        let dat: KegiatanToKompetensiDataType[]
        for (const kompetensiUid of listKompetensiUid) {
            dat!.push(addTimestamps({
                kegiatanId: idKegiatan.kegiatanId,
                kompetensiId: kompetensiUid
            }))
        }
        await tx.insert(kompetensisToKegiatans).values(dat!).onDuplicateKeyUpdate({ set: { kegiatanId: sql`kegiatan_id` } })
    })

    return await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, idKegiatan!.userId))
}

export async function tugaskanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid: string, role: 'pic' | 'anggota' }[]) {
    let dat: UserToKegiatanDataType[]
    for (const user of listUserDitugaskan) {
        dat!.push(addTimestamps({
            kegiatanId: uidKegiatan,
            userId: user.uid,
            roleKegiatan: user.role
        }))
    }
    await db.insert(usersToKegiatans).values(dat!).onDuplicateKeyUpdate({ set: { userId: sql`user_id` } })


    return await db.select().from(kegiatans)
        .innerJoin(usersToKegiatans, eq(usersToKegiatans.kegiatanId, kegiatans.kegiatanId))
        .innerJoin(users, eq(users.userId, usersToKegiatans.userId))
        .where(eq(kegiatans.kegiatanId, uidKegiatan))
}

export async function createLampiranKegiatan(udidKegiatan: string, dataLampirans: LampiranDataType[]) {
    await db.insert(lampiranKegiatans).values(addTimestamps(dataLampirans))

    return await db.select().from(kegiatans).innerJoin(lampiranKegiatans, eq(lampiranKegiatans.kegiatanId, kegiatans.kegiatanId)).where(eq(kegiatans.kegiatanId, udidKegiatan))
}

export async function createAgendaKegiatan(uidKegiatan: string, dataAgendas: AgendaKegiatanDataType[]) {
    await db.insert(agendaKegiatans).values(addTimestamps(dataAgendas))

    return await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.kegiatanId, uidKegiatan))
}

export async function createProgressAgenda(dataProgress: ProgressAgendaDataType, dataAttachment?: ProgressAttachmentDataType[]) {
    let prog
    await db.transaction(async (tx) => {
        [prog] = await tx.insert(progressAgenda).values(addTimestamps(dataProgress)).$returningId()

        if (dataAttachment) {
            for (const attachment of dataAttachment) {
                const [attach] = await tx.insert(progressAttachments).values(addTimestamps(attachment)).$returningId()
                await tx.insert(progressAgendaToProgressAttachment).values(addTimestamps({
                    progressId: prog.progressId,
                    attachmentId: attach.attachmentId,
                })).onDuplicateKeyUpdate({ set: { progressId: sql`progress_id` } })
            }
        }
    })

    return await db.select().from(progressAgenda)
        .innerJoin(progressAgendaToProgressAttachment, eq(progressAgendaToProgressAttachment.progressId, progressAgenda.progressId))
        .innerJoin(progressAttachments, eq(progressAttachments.attachmentId, progressAgendaToProgressAttachment.attachmentId))
        .where(eq(progressAgenda.progressId, prog!.progressId))
}

export async function updateKegiatan(uidKegiatan: string, data: Partial<KegiatanDataType>, listKompetensiUid: string[]) {
    await db.transaction(async (tx) => {
        await tx.update(kegiatans)
            .set(addTimestamps(data, true))
            .where(eq(kegiatans.kegiatanId, uidKegiatan))

        let dat: KegiatanToKompetensiDataType[]
        for (const kompetensiId of listKompetensiUid) {
            dat!.push(addTimestamps({
                kegiatanId: uidKegiatan,
                kompetensiId: kompetensiId,
            }))
        }
        await tx.insert(kompetensisToKegiatans).values(dat!).onDuplicateKeyUpdate({
            set: addTimestamps({
                kegiatan_id: sql`kegiatan_id`
            }, true)
        })
    })

    return await db.select().from(kegiatans)
        // Join to kompetensi
        .innerJoin(kompetensisToKegiatans, eq(kompetensisToKegiatans.kegiatanId, kegiatans.kegiatanId))
        .innerJoin(kompetensis, eq(kompetensis.kompetensiId, kompetensisToKegiatans.kompetensiId))
        .where(eq(kegiatans.kegiatanId, uidKegiatan))
}

export async function updatePenugasanKegiatan(uidKegiatan: string, listUserDitugakskan: { uid: string, role: 'pic' | 'anggota', status: 'ditugaskan' | 'selesai' }[]) {
    let dat: UserToKegiatanDataType[]
    for (const user of listUserDitugakskan) {
        dat!.push(addTimestamps({
            kegiatanId: uidKegiatan,
            userId: user.uid,
            roleKegiatan: user.role,
            status: user.status,
        }))
    }
    await db.insert(usersToKegiatans).values(dat!).onDuplicateKeyUpdate({
        set: addTimestamps({
            kegiatanId: sql`kegiatan_id`
        }, true)
    })

    return await db.select().from(kegiatans)
        .innerJoin(usersToKegiatans, eq(usersToKegiatans.kegiatanId, kegiatans.kegiatanId))
        .innerJoin(users, eq(users.userId, usersToKegiatans.userId))
        .where(eq(kegiatans.kegiatanId, uidKegiatan))
}

export async function updateLampiranKegiatan(uidLampiran: string, dataLampiran: LampiranDataType) {
    await db.update(lampiranKegiatans).set(addTimestamps(dataLampiran, true)).where(eq(lampiranKegiatans.lampiranId, uidLampiran))

    return await db.select().from(lampiranKegiatans).where(eq(lampiranKegiatans.kegiatanId, uidLampiran))
}

export async function updateAgendaKegiatan(uidAgenda: string, data: AgendaKegiatanDataType) {
    await db.update(agendaKegiatans).set(addTimestamps(data, true)).where(eq(agendaKegiatans.agendaId, uidAgenda))

    return await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))
}

export async function updateProgressAgenda(uidProgress: string, data: ProgressAgendaDataType, dataAttachment?: ProgressAttachmentDataType[]) {
    await db.transaction(async (tx) => {
        await tx.update(progressAgenda).set(addTimestamps(data, true)).where(eq(progressAgenda.progressId, uidProgress))

        if (dataAttachment) {
            for (const attachment of dataAttachment) {
                const [attach] = await tx.insert(progressAttachments).values(addTimestamps(attachment)).$returningId()
                await tx.insert(progressAgendaToProgressAttachment).values(addTimestamps({
                    progressId: uidProgress,
                    attachmentId: attach.attachmentId,
                })).onDuplicateKeyUpdate({ set: addTimestamps({ progressId: sql`progress_id` }) })
            }
        }
    })
}

export async function deleteKegiatan(uidKegiatan: string) {
    await db.delete(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))

    return await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))
}

export async function deletePenugasan(uidKegiatan: string, uidUser: string) {
    await db.delete(usersToKegiatans).where(and(eq(usersToKegiatans.kegiatanId, uidKegiatan), eq(usersToKegiatans.userId, uidUser)))

    return await db.select().from(usersToKegiatans).where(and(eq(usersToKegiatans.kegiatanId, uidKegiatan), eq(usersToKegiatans.userId, uidUser)))
}

export async function deleteLampiranKegiatan(uidLampiran: string) {
    await db.delete(lampiranKegiatans).where(eq(lampiranKegiatans.lampiranId, uidLampiran))

    return await db.select().from(lampiranKegiatans).where(eq(lampiranKegiatans.lampiranId, uidLampiran))
}

export async function deleteAgendaKegiatan(uidAgenda: string) {
    await db.delete(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))

    return await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))
}

export async function deleteProgressAgenda(uidProgress: string) {
    await db.transaction(async (tx) => {
        await tx.delete(progressAgenda).where(eq(progressAgenda.agendaId, uidProgress))

        const dat = await tx.select({ id: progressAgendaToProgressAttachment.attachmentId }).from(progressAgendaToProgressAttachment).where(eq(progressAgendaToProgressAttachment.progressId, uidProgress))
        for (const id of dat) {
            await tx.delete(progressAttachments).where(eq(progressAttachments.attachmentId, id.id))
        }
    })

    return await db.select().from(progressAgenda)
        .innerJoin(progressAgendaToProgressAttachment, eq(progressAgendaToProgressAttachment.progressId, progressAgenda.agendaId))
        .innerJoin(progressAttachments, eq(progressAttachments.attachmentId, progressAgendaToProgressAttachment.attachmentId))
        .where(eq(progressAgenda.agendaId, uidProgress))
}