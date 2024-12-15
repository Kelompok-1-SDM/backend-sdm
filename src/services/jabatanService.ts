import * as jabatanModels from '../models/jabatanModels'

export async function fetchAllJabatan(isPic?: boolean) {
    return await jabatanModels.fetchAllJabatan(isPic);
}

export async function fetchJabatan(uidJabatan: string) {
    const ap = await jabatanModels.fetchJabatanByUid(uidJabatan);
    if (!ap || Object.keys(ap).length === 0) return "jabatan_is_not_found"

    return ap
}

export async function createJabatan(data: jabatanModels.JabatanDataType) {
    return await jabatanModels.createJabatan(data)
}

export async function updateJabatan(uidJabatan: string, data: Partial<jabatanModels.JabatanDataType>) {
    const ap = await jabatanModels.updateJabatan(uidJabatan, data)
    if (!ap || Object.keys(ap).length === 0) return "jabatan_is_not_found"

    return ap
}

export async function deleteJabatan(uidJabatan: string) {
    const ap = await jabatanModels.deleteJabatan(uidJabatan)
    if (!ap || Object.keys(ap).length === 0) return "jabatan_is_not_found"

    return ap
}