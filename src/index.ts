declare module "express-serve-static-core" {
    interface Request {
        user?: {
            userId: string;
            role: 'admin' | 'manajemen' | 'dosen';
        };
    }
}

import express from 'express';
import loginRoutes from './routes/authRoute';
import userRoutes from './routes/userRoute'

const app = express()
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('port', port);

app.use('/api', loginRoutes);

app.use('/api/user', userRoutes);

app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
});