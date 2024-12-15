import * as tipeKegiatanModels from '../models/tipeKegiatanModels'

export async function fetchAllTipeKegiatan(isJti?: boolean) {
    return await tipeKegiatanModels.fetchAllTipeKegiatan(isJti);
}

export async function fetchTipeKegiatan(uidTipeKegiatan: string) {
    const ap = await tipeKegiatanModels.fetchTipeKegiatanByUid(uidTipeKegiatan);
    if (!ap || Object.keys(ap).length === 0) return "tipekegiatan_is_not_found"

    return ap
}

export async function createTipeKegiatan(data: tipeKegiatanModels.TipeKegiatanDataType) {
    return await tipeKegiatanModels.createTipeKegiatan(data)
}

export async function updateTipeKegiatan(uidTipeKegiatan: string, data: Partial<tipeKegiatanModels.TipeKegiatanDataType>) {
    const ap = await tipeKegiatanModels.updateTipeKegiatan(uidTipeKegiatan, data)
    if (!ap || Object.keys(ap).length === 0) return "tipekegiatan_is_not_found"

    return ap
}

export async function deleteTipeKegiatan(uidTipeKegiatan: string) {
    const ap = await tipeKegiatanModels.deleteTipeKegiatan(uidTipeKegiatan)
    if (!ap || Object.keys(ap).length === 0) return "tipekegiatan_is_not_found"

    return ap
}