declare module "express-serve-static-core" {
    interface Request {
        user?: {
            userId: string;
            role: 'admin' | 'manajemen' | 'dosen';
        };
    }
}

import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';

import loginRoutes from './routes/authRoute';
import userRoutes from './routes/userRoute'
import kegiatanRoutes from './routes/kegiatanRoute'
import agendaRoutes from './routes/agendaRoute'
import lampiranRoutes from './routes/lampiranRoute'
import penugasanRoutes from './routes/penugasanRoute'
import kompetensiRoutes from './routes/kompetensiRoute'
import livechatUploadRoute from './routes/livechatRoute'
import mongoose from 'mongoose';

import cors from 'cors';

import { livechatRoutes } from './routes/livechatRoute';
import { socketAuth } from './middlewares/authorizations';
import { createResponse } from './utils/utils';

const app = express()
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// TODO use secret
mongoose.connect(process.env.MONGODB_URI!)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

app.use(express.json());
// TODO enable cors later
// app.use(cors({ origin: true }))
app.use(express.urlencoded({ extended: true }));

app.set('port', port);

app.use('/api', loginRoutes);
app.use('/api/user', userRoutes);
app.use('/api/kegiatan', kegiatanRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/lampiran', lampiranRoutes);
app.use('/api/penugasan', penugasanRoutes);
app.use('/api/kompetensi', kompetensiRoutes);
app.use('/api/livechat', livechatUploadRoute);
const livechatSocket = io.of('/api/livechat')

livechatSocket.use(socketAuth);

livechatSocket.on('connection', (socket) => {
    socket.on('error', (err: Error) => {
        try {
            const errorInfo = JSON.parse(err.message);
            socket.emit('authError', errorInfo);
        } catch (parseError) {
            socket.emit('authError', { code: 500, message: 'Internal server error' });
        }
    });
    livechatRoutes(io, socket);
});


server.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
});