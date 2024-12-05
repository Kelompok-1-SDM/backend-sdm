import * as kegiatanModels from '../models/kegiatanModels'
import * as usersModels from '../models/usersModels'
import { ChatRoom, Message } from '../models/livechatModels'
import { addTimestamps } from '../models/utilsModel'

export async function fetchAllKegiatan() {
    return await kegiatanModels.fetchAllKegiatan()
}

export async function fetchKegiatanByUser(uidUser: string, isDone?: boolean, tanggal?: string,) {
    const temp = await kegiatanModels.fetchKegiatanByUser(uidUser, isDone, tanggal, undefined)
    if (temp.length === 0) return "kegiatan_is_not_found"

    return temp
}

export async function fetchKegiatan(uidKegiatan: string) {
    const temp = await kegiatanModels.fetchKegiatanByUid(uidKegiatan)
    if (!temp || Object.keys(temp!).length === 0) return "kegiatan_is_not_found"

    return temp
}

export async function createKegiatan(kegiatanData: kegiatanModels.KegiatanDataType) {

    const keg = await kegiatanModels.createKegiatan(kegiatanData)

    // Create chatroom
    const chtRoom = new ChatRoom(addTimestamps({
        roomId: keg!.kegiatanId,
    }))
    await chtRoom.save()

    return keg
}

export async function updateKegiatan(uidKegiatan: string, dataKegiatan: Partial<kegiatanModels.KegiatanDataType>) {
    const temp = await kegiatanModels.fetchKegiatanOnly(uidKegiatan)
    if (!temp || Object.keys(temp).length === 0) return "kegiatan_is_not_found"

    if (dataKegiatan.isDone && dataKegiatan.isDone == true) {
        const listUser = await kegiatanModels.fetchKegiatanByUid(uidKegiatan)
        if (listUser?.users && listUser.users.length != 0) {
            const kegKomp = await kegiatanModels.fetchKegiatanOnly(uidKegiatan)
            await Promise.all(listUser!.users.map(async (it) => {
                await usersModels.addJumlahKegiatan(it.userId, undefined, kegKomp!.tanggalMulai!.getFullYear(), kegKomp!.tanggalMulai!.getMonth() + 1)

            }))
        }

    }

    return await kegiatanModels.updateKegiatan(uidKegiatan, dataKegiatan)
}

export async function deleteKegiatan(uidKegiatan: string) {
    const ap = await kegiatanModels.deleteKegiatan(uidKegiatan)
    if (!ap || Object.keys(ap).length === 0) return "kegiatan_is_not_found"

    // Rempve chatroom
    await ChatRoom.findOneAndDelete({ roomId: uidKegiatan })
    await Message.deleteMany({ roomId: uidKegiatan })

    return ap
}