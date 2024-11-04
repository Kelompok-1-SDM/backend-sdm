declare module "express-serve-static-core" {
    interface Request {
        user: {
            userId: string;
            role: 'admin' | 'manajemen' | 'dosen';
        };
    }
}

import express from 'express';
import loginRoutes from './routes/authRoute';
import userRoutes from './routes/userRoute'
import kegiatanRoutes from './routes/kegiatanRoute'
import agendaRoutes from './routes/agendaRoute'
import lampiranRoutes from './routes/lampiranRoute'
import penugasanRoutes from './routes/penugasanRoute'
import kompetensiRoutes from './routes/kompetensiRoute'

import cors from 'cors';

const app = express()
const port = process.env.PORT || 3000;

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


app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
});