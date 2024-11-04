import { fetchKegiatanByUid } from '../models/kegiatanModels'
import * as penugasanModels from '../models/penugasanModels'
import { fetchUserByUid } from '../models/usersModels'

export async function tugaskanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, role: 'pic' | 'anggota' }[]) {
    // TODO Do notification
    return await penugasanModels.createPenugasan(uidKegiatan, listUserDitugaskan)
}

export async function updatePenugasanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, role: 'pic' | 'anggota', status: 'ditugaskan' | 'selesai' }[]) {
    // TODO Do notification
    return await penugasanModels.updatePenugasanKegiatan(uidKegiatan, listUserDitugaskan)
}

export async function deletePenugasan(uidKegiatan: string, uidUser: string) {
    const ap = await fetchKegiatanByUid(uidKegiatan)
    if (!ap) return "kegiatan_is_not_found"

    const wt = await fetchUserByUid(uidUser)
    if (!wt) return "user_is_not_found"

    return penugasanModels.deletePenugasan(uidKegiatan, uidUser)
}