import { Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import * as livechatServices from '../services/livechatService';
import { createResponse } from '../utils/utils';

// Join room handler
export async function joinRoom(socket: Socket, io: Server, { uidRoom }: { uidRoom: string }) {
    const uidUser = socket.data.user.userId;
    const result = await livechatServices.joinRoom(uidRoom, uidUser);

    if (result === 'not_allowed') {
        socket.emit('error', { code: 403, message: "You're not allowed to join this room" });
    } else {
        socket.join(uidRoom);

        const [mbd] = socket.rooms
        socket.leave(mbd)
        socket.emit('message', `currently your on ${Array.from(socket.rooms)}`)
        io.to(uidRoom).emit('userJoined', { uidUser });
    }
}

// Chat message handler
export async function chatMessage(socket: Socket, io: Server, { uidRoom, message, attachment }: { uidRoom: string; message: string; attachment: { filename: string, url: string, type: string }[] }) {
    const senderId = socket.data.user.userId;
    const isUserInRoom = await livechatServices.isUserInRoom(uidRoom, senderId);

    if (!isUserInRoom) {
        socket.emit('error', { code: 403, message: "Not allowed to post in this room" });
        return;
    }

    const newMessage = await livechatServices.sendMessage(uidRoom, senderId, message, attachment);
    io.to(uidRoom).emit('message', newMessage);
}


// Edit message handler
export async function editMessage(socket: Socket, io: Server, { messageId, message }: { messageId: string; message: string }) {
    const updatedMessage = await livechatServices.editMessage(messageId, message);
    if (!updatedMessage) {
        socket.emit('error', { code: 404, message: "Message not found" });
    } else {
        io.to(updatedMessage.uidRoom!).emit('edit', updatedMessage);
    }
}

// Delete message handler
export async function deleteMessage(socket: Socket, io: Server, { messageId }: { messageId: string }) {
    const deletedMessage = await livechatServices.deleteMessage(messageId);
    if (!deletedMessage) {
        socket.emit('error', { code: 404, message: "Message not found" });
    } else {
        io.to(deletedMessage.roomId).emit('delete', deletedMessage._id);
    }
}

export async function uploadMessageAttachment(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        res.status(400).json(createResponse(
            false,
            null,
            "Key files is missing or not uploaded(minimum 1)"
        ));
        return
    }

    try {
        const data = await livechatServices.uploadMessageAttachment(files)
        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : null,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
}