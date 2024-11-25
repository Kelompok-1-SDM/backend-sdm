import path from 'path'
import * as lampiranModels from '../models/lampiranModels'
import { calculateFileHash, uploadFileToCdn } from './utilsService'

export async function createLampiran(uidkegiatan: string, files: Express.Multer.File[]) {
    // TODO Do notification
    const dataLampiran = await Promise.all(
        files.map(async (file) => {
            const hashFile = calculateFileHash(file.buffer)
            const fileUrl = await uploadFileToCdn(file, hashFile, 'lampiran')
            return { kegiatanId: uidkegiatan, nama: path.basename(file.originalname), url: fileUrl }
        })
    )

    return await lampiranModels.createLampiran(dataLampiran)
}


export async function deleteLampiran(uidLampiran: string) {
    const ap = await lampiranModels.fetchLampiranByUid(uidLampiran)
    if (!ap || Object.keys(ap).length === 0) return `lampiran_is_not_found`

    return lampiranModels.deleteLampiranKegiatan(uidLampiran)
}