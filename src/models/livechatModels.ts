// src/models/ChatModels.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

// ChatRoom Interface
export interface IChatRoom extends Document {
    roomId: string;
    assignedUsers?: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Message Interface with Attachment
export interface IMessage extends Document {
    roomId: string;
    senderId: string;
    message: string;
    createdAt: Date;
    updatedAt: Date;
    attachments?: {
        filename: string;
        url: string;
        type: string;
    }[];
}

// ChatRoom Schema
const ChatRoomSchema: Schema = new Schema({
    roomId: { type: String, required: true },
    assignedUsers: [{ type: String, required: true, index: true }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, required: true },
});

// Message Schema with Attachments
const MessageSchema: Schema = new Schema({
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, required: true },
    attachments: [
        {
            filename: { type: String, required: true },
            url: { type: String, required: true },
            type: { type: String, required: true },
        },
    ],
});

const ChatRoom: Model<IChatRoom> = mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);

export { ChatRoom, Message };


