import { fetchKegiatanByUid } from '../models/kegiatanModels'
import * as penugasanModels from '../models/penugasanModels'
import * as kegiatanModels from '../models/kegiatanModels'
import * as usersModels from '../models/usersModels'
import { fetchUserByUid } from '../models/usersModels'

export async function tugaskanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, role: 'pic' | 'anggota' }[]) {
    // TODO Do notification
    return await penugasanModels.createPenugasan(uidKegiatan, listUserDitugaskan)
}

export async function updatePenugasanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, role: 'pic' | 'anggota', status: 'ditugaskan' | 'selesai' }[]) {
    // TODO Do notification
    const apa = await penugasanModels.updatePenugasanKegiatan(uidKegiatan, listUserDitugaskan)

    const kegKomp = await kegiatanModels.fetchKompetensiKegiatan(uidKegiatan)
    await Promise.all(listUserDitugaskan.map(async (ap) => {
        if (ap.status === 'selesai') {
            await usersModels.addUserKompetensi(ap.uid_user, kegKomp.kompetensi)
            await usersModels.addJumlahKegiatan(ap.uid_user, undefined, kegKomp.tanggal!.getFullYear(), kegKomp.tanggal!.getMonth() + 1)
        } else if (ap.status === 'ditugaskan') {
            await usersModels.addJumlahKegiatan(ap.uid_user, true, kegKomp.tanggal!.getFullYear(), kegKomp.tanggal!.getMonth() + 1)
        }
    }))

    return apa
}

export async function deletePenugasan(uidKegiatan: string, uidUser: string) {
    const ap = await fetchKegiatanByUid(uidKegiatan)
    if (!ap) return "kegiatan_is_not_found"

    const wt = await fetchUserByUid(uidUser)
    if (!wt) return "user_is_not_found"

    const apa = await penugasanModels.deletePenugasan(uidKegiatan, uidUser)

    const kegKomp = await kegiatanModels.fetchKegiatanByUid(uidKegiatan)
    await usersModels.addJumlahKegiatan(uidUser, true, kegKomp.tanggal!.getFullYear(), kegKomp.tanggal!.getMonth() + 1)

    return apa
}