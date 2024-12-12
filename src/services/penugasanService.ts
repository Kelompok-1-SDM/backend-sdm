import { fetchKegiatanByUid } from '../models/kegiatanModels'
import * as penugasanModels from '../models/penugasanModels'
import * as kegiatanModels from '../models/kegiatanModels'
import * as usersModels from '../models/usersModels'
import { fetchUserByUid } from '../models/usersModels'
import { ChatRoom } from '../models/livechatModels'

export async function fetchPenugasanOnKegiatan(uidKegiatan: string, uidUser: string) {
    const apa = await penugasanModels.fetchKegiatanWithUser(uidKegiatan, uidUser)
    if (!apa || Object.keys(apa).length === 0) return "penugasan_is_not_found"

    return apa
}

export async function tugaskanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, uid_jabatan: string }[]) {
    // TODO Do notification
    const penugasan = await penugasanModels.createPenugasan(uidKegiatan, listUserDitugaskan)

    const kegKomp = await kegiatanModels.fetchKegiatanOnly(uidKegiatan)
    await Promise.all(listUserDitugaskan!.map(async (it) => {
        await usersModels.addJumlahKegiatan(it.uid_user, undefined, kegKomp!.tanggalMulai!.getFullYear(), kegKomp!.tanggalMulai!.getMonth() + 1)
    }))

    const cht = await ChatRoom.findOne({ roomId: uidKegiatan })
    await Promise.all(listUserDitugaskan.map(async (asp) => {
        if (cht && !cht.assignedUsers?.includes(asp.uid_user)) {
            cht.assignedUsers!.push(asp.uid_user)
        }
    }))
    await cht?.save()

    return penugasan
}

export async function updatePenugasanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, uid_jabatan: string }[]) {
    // TODO Do notification
    const apa = await penugasanModels.updatePenugasanKegiatan(uidKegiatan, listUserDitugaskan)

    const kegKomp = await kegiatanModels.fetchKegiatanOnly(uidKegiatan)
    await Promise.all(listUserDitugaskan!.map(async (it) => {
        await usersModels.addJumlahKegiatan(it.uid_user, undefined, kegKomp!.tanggalMulai!.getFullYear(), kegKomp!.tanggalMulai!.getMonth() + 1)
    }))

    const cht = await ChatRoom.findOne({ roomId: uidKegiatan })
    await Promise.all(listUserDitugaskan.map(async (asp) => {
        if (cht && !cht.assignedUsers?.includes(asp.uid_user)) {
            cht.assignedUsers!.push(asp.uid_user)
        }
    }))
    await cht?.save()

    return apa
}

export async function deletePenugasan(uidKegiatan: string, uidUser: string) {
    // TODO fix logic here
    const ap = await fetchKegiatanByUid(uidKegiatan)
    if (!ap || Object.keys(ap).length === 0) return "kegiatan_is_not_found"

    const wt = await fetchUserByUid(uidUser)
    if (!wt || Object.keys(wt).length === 0) return "user_is_not_found"

    const apa = await penugasanModels.deletePenugasan(uidKegiatan, uidUser)

    const keg = await kegiatanModels.fetchKegiatanOnly(uidKegiatan)
    await usersModels.addJumlahKegiatan(uidUser, true, keg!.tanggalMulai!.getFullYear(), keg!.tanggalMulai!.getMonth() + 1)

    const kegKomp = await kegiatanModels.fetchKegiatanByUid(uidKegiatan)
    const tahun = kegKomp?.tanggalMulai ? kegKomp?.tanggalMulai?.getFullYear() : 0
    const bulan = kegKomp?.tanggalMulai ? kegKomp?.tanggalMulai?.getMonth() + 1 : 0

    await usersModels.addJumlahKegiatan(uidUser, true, tahun, bulan)

    return apa
}