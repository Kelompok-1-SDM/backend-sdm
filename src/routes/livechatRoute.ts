import express from 'express';

// livechatRoutes.ts
import { Server, Socket } from 'socket.io';
import { joinRoom, chatMessage, editMessage, deleteMessage, uploadMessageAttachment } from '../controllers/livechatController';
import { handleFileUploadArray } from '../middlewares/uploadFiles';
import { authorize } from '../middlewares/authorizations';

export const livechatRoutes = (io: Server, socket: Socket) => {
    socket.on('join', (data) => joinRoom(socket, io, data));
    socket.on('message', (data) => chatMessage(socket, io, data));
    socket.on('edit', (data) => editMessage(socket, io, data));
    socket.on('delete', (data) => deleteMessage(socket, io, data));
};

const router = express.Router();

router.post('/',
    [
        authorize(['admin', 'manajemen', 'dosen']),
        handleFileUploadArray,
    ], uploadMessageAttachment
)

export default router