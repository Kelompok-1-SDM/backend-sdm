import express from 'express';
import { query } from 'express-validator';
import { Server, Socket } from 'socket.io';
import * as livechatController from '../controllers/livechatController';
import { handleFileUploadArray } from '../middlewares/uploadFiles';
import { authorize } from '../middlewares/authorizations';

export const livechatRoutes = (io: Server, socket: Socket) => {
    socket.on('join', (data) => livechatController.joinRoom(socket, io, data));
    socket.on('message', (data) => livechatController.chatMessage(socket, io, data));
    socket.on('edit', (data) => livechatController.editMessage(socket, io, data));
    socket.on('delete', (data) => livechatController.deleteMessage(socket, io, data));
};

const router = express.Router();

router.get('/history',
    [authorize(['admin', 'manajemen', 'dosen']),
    query('uid_room').isString().trim().toLowerCase().withMessage("This key is required and it's string"),
    query('uid_room').notEmpty().withMessage("This key should not be empty")
    ], livechatController.fetchMessageHistory
)

router.post('/',
    [authorize(['admin', 'manajemen', 'dosen']),
        handleFileUploadArray,
    ], livechatController.uploadMessageAttachment
)

export default router