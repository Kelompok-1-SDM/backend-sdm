import * as agendaModels from '../models/agendaModels'
import { calculateFileHash, uploadFileToCdn } from './utilsService'
import path from 'path'

const findCurrentFileRecord = async (file: Express.Multer.File) => {
    const hashFile = calculateFileHash(file.buffer)
    const res = await agendaModels.fetchProgressAttach(hashFile)
    if (res) return res

    const fileUrl = await uploadFileToCdn(file, hashFile, 'progress')
    return {
        nama: path.basename(file.originalname),
        url: fileUrl,
        hash: hashFile
    }
}

export async function fetchAgenda(uidAgenda: string) {
    const temp = await agendaModels.fetchAgenda(uidAgenda)
    if (!temp || Object.keys(temp).length === 0) return "agenda_is_not_found"

    return temp
}

export async function createAgenda(dataAgenda: agendaModels.AgendaKegiatanDataType, listUiduserKegiatan?: string[]) {

    return await agendaModels.createAgenda(dataAgenda, listUiduserKegiatan)
}

export async function createProgressAgenda(dataProgress: agendaModels.ProgressAgendaDataType, files: Express.Multer.File[]) {
    // TODO Do notification

    const upload = await Promise.all(
        files.map(async (file) => await findCurrentFileRecord(file))
    )

    return await agendaModels.createProgressAgenda(dataProgress, upload)
}

export async function updateAgenda(uidAgenda: string, dataAgenda: agendaModels.AgendaKegiatanDataType, listUiduserKegiatan: string[]) {
    // TODO Do ntoofication`
    
    const ap = await agendaModels.fetchAgenda(uidAgenda)
    if (!ap || Object.keys(ap).length === 0) return "agenda_is_not_found"

    return await agendaModels.updateAgenda(uidAgenda, dataAgenda, listUiduserKegiatan)
}

export async function updateProgressAgenda(uidProgress: string, dataProgress: agendaModels.ProgressAgendaDataType, files: Express.Multer.File[]) {
    // TODO Do notification
    const ap = await agendaModels.fetchProgress(uidProgress)
    if (!ap || Object.keys(ap).length === 0) return "progress_is_not_found"

    let upload
    if (files) {
        upload = await Promise.all(
            files.map(async (file) => await findCurrentFileRecord(file))
        )
    }


    return await agendaModels.updateProgress(uidProgress, dataProgress, upload)
}

export async function deleteAgenda(uidAgenda: string) {
    const ap = await agendaModels.deleteAgenda(uidAgenda)
    if (!ap || Object.keys(ap).length === 0) return "agenda_is_not_found"

    return ap
}

export async function deleteUserFromAgenda(uidAgenda: string, uidUserKegiatan: string) {
    const ap = await agendaModels.deleteUserFromAgenda(uidAgenda, uidUserKegiatan)
    if (!ap || Object.keys(ap).length === 0) return "agenda_is_not_found"

    return ap
}

export async function deleteProgress(uidProgress: string) {
    const ap = await agendaModels.deleteProgress(uidProgress)
    if (!ap || Object.keys(ap).length === 0) return "progress_is_not_found"

    return ap
}

export async function deletAttachmentProgress(uidProgress: string, uidAttachment: string) {
    const ap = await agendaModels.deleteProgress(uidProgress)
    if (!ap || Object.keys(ap).length === 0) return "progress_is_not_found"

    return await agendaModels.deletAttachmentProgress(uidProgress, uidAttachment)
}
