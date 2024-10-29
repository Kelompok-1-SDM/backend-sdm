import { and, eq, isNull, sql } from "drizzle-orm";
import { agendaKegiatans, kegiatans, kompetensis, kompetensisToKegiatans, lampiranKegiatans, progressAgenda, progressAgendaToProgressAttachment, progressAttachments, users, usersToKegiatans } from "../../db/schema";
import { addTimestamps, db } from "../utils";

export type KegiatanDataType = typeof kegiatans.$inferInsert
export type LampiranDataType = typeof lampiranKegiatans.$inferInsert
export type AgendaKegiatanDataType = typeof agendaKegiatans.$inferInsert
export type ProgressAgendaDataType = typeof progressAgenda.$inferInsert
export type ProgressAttachmentDataType = typeof progressAttachments.$inferInsert

export type KegiatanToKompetensiDataType = typeof kompetensisToKegiatans.$inferInsert
export type UserToKegiatanDataType = typeof usersToKegiatans.$inferInsert

async function fetchAllKegiatan(showAllData: boolean = false) {
    return await db.select().from(kegiatans).where(showAllData ? isNull(users.deletedAt) : undefined)
}

async function fetchKegiatanByUser(uidUser: string, showAllData: boolean = false) {
    return await db.select().from(users)
        // Join user_to_kegiatan
        .innerJoin(usersToKegiatans, and(eq(usersToKegiatans.userId, users.userId), showAllData ? isNull(users.deletedAt) : undefined))
        .innerJoin(kegiatans, and(eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId), showAllData ? isNull(users.deletedAt) : undefined))
        .where(and(eq(users.userId, uidUser), showAllData ? isNull(users.deletedAt) : undefined))
}

async function fetchKegiatanInfo(uidKegiatan: string, showAllData: boolean = false) {
    return await db.select().from(kegiatans)
        // Join user
        .innerJoin(usersToKegiatans, and(eq(usersToKegiatans.kegiatanId, kegiatans.kegiatanId), showAllData ? isNull(users.deletedAt) : undefined))
        .innerJoin(users, and(eq(users.userId, usersToKegiatans.userId), showAllData ? isNull(users.deletedAt) : undefined))
        //Join Lampiran Kegiatan
        .innerJoin(lampiranKegiatans, and(eq(lampiranKegiatans.kegiatanId, kegiatans.kegiatanId), showAllData ? isNull(users.deletedAt) : undefined))
        // Join agenda
        .innerJoin(agendaKegiatans, and(eq(agendaKegiatans.kegiatanId, kegiatans.kegiatanId), showAllData ? isNull(users.deletedAt) : undefined))
        // Join progress agenda
        .where(and(eq(kegiatans.kegiatanId, uidKegiatan), showAllData ? isNull(users.deletedAt) : undefined))
}

async function fetchProgress(uidProgress: string, showAllData: boolean = false) {
    return await db.select().from(agendaKegiatans)
        .innerJoin(progressAgenda, and(eq(progressAgenda.agendaId, agendaKegiatans.agendaId), showAllData ? isNull(users.deletedAt) : undefined))
        //Join attachment
        .innerJoin(progressAgendaToProgressAttachment, and(eq(progressAgendaToProgressAttachment.progressId, progressAgenda.progressId), showAllData ? isNull(users.deletedAt) : undefined))
        .innerJoin(progressAttachments, and(eq(progressAttachments.attachmentId, progressAgendaToProgressAttachment.attachmentId), showAllData ? isNull(users.deletedAt) : undefined))
        .where(and(eq(agendaKegiatans.kegiatanId, uidProgress), showAllData ? isNull(users.deletedAt) : undefined))
}

async function createKegiatan(kegiatanData: KegiatanDataType, listKompetensiUid: string[]) {
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
        await tx.insert(kompetensisToKegiatans).values(dat!).onDuplicateKeyUpdate({ set: { kegiatanId: sql`kegiatanId` } })
    })

    return await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, idKegiatan!.userId))
}

async function tugaskanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid: string, role: 'pic' | 'anggota' }[]) {
    let dat: UserToKegiatanDataType[]
    for (const user of listUserDitugaskan) {
        dat!.push(addTimestamps({
            kegiatanId: uidKegiatan,
            userId: user.uid,
            roleKegiatan: user.role
        }))
    }
    await db.insert(usersToKegiatans).values(dat!).onDuplicateKeyUpdate({ set: { userId: sql`userId` } })


    return await db.select().from(kegiatans)
        .innerJoin(usersToKegiatans, eq(usersToKegiatans.kegiatanId, kegiatans.kegiatanId))
        .innerJoin(users, eq(users.userId, usersToKegiatans.userId))
        .where(eq(kegiatans.kegiatanId, uidKegiatan))
}

async function createLampiranKegiatan(udidKegiatan: string, dataLampirans: LampiranDataType[]) {
    await db.insert(lampiranKegiatans).values(addTimestamps(dataLampirans))

    return await db.select().from(kegiatans).innerJoin(lampiranKegiatans, eq(lampiranKegiatans.kegiatanId, kegiatans.kegiatanId)).where(eq(kegiatans.kegiatanId, udidKegiatan))
}

async function createAgendaKegiatan(uidKegiatan: string, dataAgendas: AgendaKegiatanDataType[]) {
    await db.insert(agendaKegiatans).values(addTimestamps(dataAgendas))

    return await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.kegiatanId, uidKegiatan))
}

async function createProgressAgenda(dataProgress: ProgressAgendaDataType, dataAttachment?: ProgressAttachmentDataType[]) {
    let prog
    await db.transaction(async (tx) => {
        [prog] = await tx.insert(progressAgenda).values(addTimestamps(dataProgress)).$returningId()

        if (dataAttachment) {
            for (const attachment of dataAttachment) {
                const [attach] = await tx.insert(progressAttachments).values(addTimestamps(attachment)).$returningId()
                await tx.insert(progressAgendaToProgressAttachment).values(addTimestamps({
                    progressId: prog.progressId,
                    attachmentId: attach.attachmentId,
                })).onDuplicateKeyUpdate({ set: { progressId: sql`progressId` } })
            }
        }
    })

    return await db.select().from(progressAgenda)
        .innerJoin(progressAgendaToProgressAttachment, eq(progressAgendaToProgressAttachment.progressId, progressAgenda.progressId))
        .innerJoin(progressAttachments, eq(progressAttachments.attachmentId, progressAgendaToProgressAttachment.attachmentId))
        .where(eq(progressAgenda.progressId, prog!.progressId))
}

async function updateKegiatan(uidKegiatan: string, data: Partial<KegiatanDataType>, listKompetensiUid: string[]) {
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
                deletedAt: null
            }, true)
        })
    })

    return await db.select().from(kegiatans)
        // Join to kompetensi
        .innerJoin(kompetensisToKegiatans, eq(kompetensisToKegiatans.kegiatanId, kegiatans.kegiatanId))
        .innerJoin(kompetensis, eq(kompetensis.kompetensiId, kompetensisToKegiatans.kompetensiId))
        .where(eq(kegiatans.kegiatanId, uidKegiatan))
}

async function updatePenugasanKegiatan(uidKegiatan: string, listUserDitugakskan: { uid: string, role: 'pic' | 'anggota', status: 'ditugaskan' | 'selesai', restoreRelation: boolean }[]) {
    let dat: UserToKegiatanDataType[]
    for (const user of listUserDitugakskan) {
        dat!.push(addTimestamps({
            kegiatanId: uidKegiatan,
            userId: user.uid,
            roleKegiatan: user.role,
            status: user.status,
            deletedAt: !user.restoreRelation ? sql`NOW()` : null
        }))
    }
    await db.insert(usersToKegiatans).values(dat!).onDuplicateKeyUpdate({
        set: addTimestamps({
            deletedAt: null
        }, true)
    })

    return await db.select().from(kegiatans)
        .innerJoin(usersToKegiatans, eq(usersToKegiatans.kegiatanId, kegiatans.kegiatanId))
        .innerJoin(users, eq(users.userId, usersToKegiatans.userId))
        .where(eq(kegiatans.kegiatanId, uidKegiatan))
}

async function updateLampiranKegiatan(uidLampiran: string, dataLampiran: LampiranDataType) {
    await db.update(lampiranKegiatans).set(addTimestamps(dataLampiran, true)).where(eq(lampiranKegiatans.lampiranId, uidLampiran))

    return await db.select().from(lampiranKegiatans).where(eq(lampiranKegiatans.kegiatanId, uidLampiran))
}

async function updateAgendaKegiatan(uidAgenda: string, data: AgendaKegiatanDataType) {
    await db.update(agendaKegiatans).set(addTimestamps(data, true)).where(eq(agendaKegiatans.agendaId, uidAgenda))

    return await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))
}

async function updateProgressAgenda(uidProgress: string, data: ProgressAgendaDataType, dataAttachment?: ProgressAttachmentDataType[]) {
    await db.transaction(async (tx) => {
        await tx.update(progressAgenda).set(addTimestamps(data, true)).where(eq(progressAgenda.progressId, uidProgress))

        if (dataAttachment) {
            for (const attachment of dataAttachment) {
                const [attach] = await tx.insert(progressAttachments).values(addTimestamps(attachment)).$returningId()
                await tx.insert(progressAgendaToProgressAttachment).values(addTimestamps({
                    progressId: uidProgress,
                    attachmentId: attach.attachmentId,
                })).onDuplicateKeyUpdate({ set: addTimestamps({ deletedAt: null }) })
            }
        }
    })
}

async function deleteKegiatan(uidKegiatan: string) {
    await db.update(kegiatans).set(addTimestamps({ deletedAt: sql`NOW()` }, true)).where(eq(kegiatans.kegiatanId, uidKegiatan))

    return await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))
}

async function deletePenugasan(uidKegiatan: string, uidUser: string) {
    await db.update(usersToKegiatans).set(addTimestamps({ deletedAt: sql`NOW()` }, true)).where(and(eq(usersToKegiatans.kegiatanId, uidKegiatan), eq(usersToKegiatans.userId, uidUser)))

    return await db.select().from(usersToKegiatans).where(and(eq(usersToKegiatans.kegiatanId, uidKegiatan), eq(usersToKegiatans.userId, uidUser)))
}

async function deleteLampiranKegiatan(uidLampiran: string) {
    await db.update(lampiranKegiatans).set(addTimestamps({ deletedAt: sql`NOW()` }, true)).where(eq(lampiranKegiatans.lampiranId, uidLampiran))

    return await db.select().from(lampiranKegiatans).where(eq(lampiranKegiatans.lampiranId, uidLampiran))
}

async function deleteAgendaKegiatan(uidAgenda: string) {
    await db.update(agendaKegiatans).set(addTimestamps({ deletedAt: new Date }, true)).where(eq(agendaKegiatans.agendaId, uidAgenda))

    return await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.agendaId, uidAgenda))
}

async function deleteProgressAgenda(uidProgress: string) {
    await db.transaction(async (tx) => {
        await tx.update(progressAgenda).set(addTimestamps({ deletedAt: sql`NOW()` }, true)).where(eq(progressAgenda.agendaId, uidProgress))

        const dat = await tx.select({ id: progressAgendaToProgressAttachment.attachmentId }).from(progressAgendaToProgressAttachment).where(eq(progressAgendaToProgressAttachment.progressId, uidProgress))
        for (const id of dat) {
            await tx.update(progressAttachments).set(addTimestamps({ deletedAt: sql`NOW()` })).where(eq(progressAttachments.attachmentId, id.id))
        }
    })

    return await db.select().from(progressAgenda)
        .innerJoin(progressAgendaToProgressAttachment, eq(progressAgendaToProgressAttachment.progressId, progressAgenda.agendaId))
        .innerJoin(progressAttachments, eq(progressAttachments.attachmentId, progressAgendaToProgressAttachment.attachmentId))
        .where(eq(progressAgenda.agendaId, uidProgress))
}