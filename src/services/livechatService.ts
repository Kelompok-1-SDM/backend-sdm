import path from "path";
import { ChatRoom, Message } from "../models/livechatModels";
import { addTimestamps } from "../models/utilsModel";
import { calculateFileHash, uploadFileToCdn } from "./utilsService";

// Implemet history livechat

// Check if user is in room
export async function isUserInRoom(uidRoom: string, uidUser: string): Promise<boolean> {
    const chatRoom = await ChatRoom.findOne({ roomId: uidRoom, assignedUsers: uidUser });
    return !!chatRoom;
}

export async function joinRoom(uidRoom: string, uidUser: string) {
    const chatRoom = await isUserInRoom(uidRoom, uidUser);
    // if (chatRoom && !chatRoom.assignedUsers!.includes(uidUser)) return "not_allowed";
    if (!chatRoom) return "not_allowed"
    return "ok";
}

export async function sendMessage(uidRoom: string, uidUser: string, message: string, attachment: { filename: string, url: string, type: string }[]) {
    const newMessage = new Message(addTimestamps({ roomId: uidRoom, senderId: uidUser, message, attachment }));
    await newMessage.save();
    return {
        ...newMessage,
        uidRoom: newMessage.roomId,
        uidUser: newMessage.senderId,

        roomId: undefined,
        senderId: undefined
    };
}

export async function editMessage(messageId: string, message: string) {
    const updatedMessage = await Message.findByIdAndUpdate(messageId, addTimestamps({ message }, true), { new: true });
    return {
        ...updatedMessage,
        uidRoom: updatedMessage?.roomId,
        uidUser: updatedMessage?.senderId,

        roomId: undefined,
        senderId: undefined
    };
}

export async function deleteMessage(messageId: string) {
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    return deletedMessage;
}


export async function uploadMessageAttachment(files: Express.Multer.File[]) {
    const res = await Promise.all(
        files.map(async (file) => {
            const hashFile = calculateFileHash(file.buffer)
            const fileUrl = await uploadFileToCdn(file, hashFile, 'lampiran')
            return { filename: path.basename(file.originalname), url: fileUrl, type: file.mimetype }
        })
    )

    return res
}