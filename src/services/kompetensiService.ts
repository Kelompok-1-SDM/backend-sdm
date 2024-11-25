import * as kompetensiModels from '../models/kompetensiModels'

export async function fetchAllKompetensi() {
    return await kompetensiModels.fetchAllKompentensi();
}

export async function fetchKompetensi(uidKompetensi: string) {
    const ap = await kompetensiModels.fetchKompetensiByUid(uidKompetensi);
    if (!ap || Object.keys(ap).length === 0) return "kompetensi_is_not_found"

    return ap
}

export async function createKompetensi(data: kompetensiModels.KompetensiDataType) {
    return await kompetensiModels.createKompetensi(data)
}

export async function updateKompetensi(uidKompetensi: string, data: Partial<kompetensiModels.KompetensiDataType>) {
    const ap = await kompetensiModels.updateKompetensi(uidKompetensi, data)
    if (!ap || Object.keys(ap).length === 0) return "kompetensi_is_not_found"

    return ap
}

export async function deleteKompetensi(uidKompetensi: string) {
    const ap = await kompetensiModels.deleteKompetensi(uidKompetensi)
    if (!ap || Object.keys(ap).length === 0) return "kompetensi_is_not_found"

    return ap
}