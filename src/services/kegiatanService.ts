import * as kegiatanModels from '../models/kegiatanModels'
import { ChatRoom, Message } from '../models/livechatModels'
import { addTimestamps } from '../models/utilsModel'

export async function fetchAllKegiatan() {
    return await kegiatanModels.fetchAllKegiatan()
}

export async function fetchKegiatanByUser(uidUser: string, status?: 'selesai' | 'ditugaskan') {
    const temp = await kegiatanModels.fetchKegiatanByUser(uidUser, status, undefined)
    if (!temp.userId) return "user_is_not_found"
    if (temp.kegiatan.length === 0) return "kegiatan_is_not_found"

    return temp
}

export async function fetchKegiatan(uidKegiatan: string) {
    const temp = await kegiatanModels.fetchKegiatanByUid(uidKegiatan)
    if (!temp.kegiatanId) return "kegiatan_is_not_found"

    return temp
}

export async function createKegiatan(kegiatanData: kegiatanModels.KegiatanDataType, listKompetensiUid: string[]) {

    const keg = await kegiatanModels.createKegiatan(kegiatanData, listKompetensiUid)

    const chtRoom = new ChatRoom(addTimestamps({
        roomId: keg.kegiatanId,
    }))
    await chtRoom.save()

    return keg
}

export async function updateKegiatan(uidKegiatan: string, dataKegiatan: Partial<kegiatanModels.KegiatanDataType>, listKompetensiUid: string[]) {
    const temp = await kegiatanModels.fetchKegiatanOnly(uidKegiatan)
    if (!temp) return "kegiatan_is_not_found"

    return await kegiatanModels.updateKegiatan(uidKegiatan, dataKegiatan, listKompetensiUid)
}

export async function deleteKegiatan(uidKegiatan: string) {
    const ap = await kegiatanModels.deleteKegiatan(uidKegiatan)
    if (!ap) return "kegiatan_is_not_found"

    await ChatRoom.findByIdAndDelete(uidKegiatan)
    await Message.deleteMany({ roomId: uidKegiatan })

    return ap
}