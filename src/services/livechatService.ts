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
    if (!chatRoom) return "not_allowed"
    return "ok";
}

export async function sendMessage(uidRoom: string, uidUser: string, message: string, attachments: { filename: string, url: string, type: string }[]) {
    const newMessage = new Message(addTimestamps({ roomId: uidRoom, senderId: uidUser, message, attachments }));
    await newMessage.save();
    return {
        uidRoom: newMessage!.roomId,
        uidUser: newMessage!.senderId,

        roomId: undefined,
        senderId: undefined,

        message: newMessage!.message,
        createdAt: newMessage!.createdAt,
        updatedAt: newMessage!.updatedAt,
        attachments: newMessage!.attachments
    };
}

//TODO check this
export async function editMessage(messageId: string, message: string) {
    const updatedMessage = await Message.findByIdAndUpdate(messageId, addTimestamps({ message }, true), { new: true });
    return {
        uidRoom: updatedMessage!.roomId,
        uidUser: updatedMessage!.senderId,

        roomId: undefined,
        senderId: undefined,

        message: updatedMessage!.message,
        createdAt: updatedMessage!.createdAt,
        updatedAt: updatedMessage!.updatedAt,
        attachments: updatedMessage!.attachments
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

export async function fetchMessageHistory(uidroom: string) {
    const data = await ChatRoom.findOne({ roomId: uidroom })
    if (!data) return "room_not_found"

    const temp = await Message.find({ roomId: uidroom }).sort({ createdAt: 1 })
    const messages = temp.map((it) => {
        return {
            uidRoom: it.roomId,
            uidUser: it.senderId,

            roomId: undefined,
            senderId: undefined,

            message: it.message,
            createdAt: it.createdAt,
            updatedAt: it.updatedAt,
            attachments: it.attachments
        }
    })

    return messages
}

export async function fetchLatestMessageFromChat(uidRoom: string) {
    // Check if the room exists
    const chatRoom = await ChatRoom.findOne({ roomId: uidRoom });
    if (!chatRoom) return "room_not_found";

    // Fetch the latest message with attachments
    const latestMessage = await Message.findOne({ roomId: uidRoom, attachments: { $exists: true, $not: { $size: 0 } } })
        .sort({ createdAt: -1 }); // Sort by newest first

    if (!latestMessage) return "no_message_with_attachments";

    // Map and return the message structure
    return {
        uidRoom: latestMessage.roomId,
        uidUser: latestMessage.senderId,

        roomId: undefined,
        senderId: undefined,

        message: latestMessage.message,
        createdAt: latestMessage.createdAt,
        updatedAt: latestMessage.updatedAt,
        attachments: latestMessage.attachments, // Include attachments in the response
    };
}
