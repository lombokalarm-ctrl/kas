import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import cashRoutes from './routes/cash.js';
dotenv.config();
const app = express();
const clientDistPath = path.resolve(process.cwd(), 'dist');
const hasClientBuild = existsSync(path.join(clientDistPath, 'index.html'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/cash', cashRoutes);
app.use('/api/health', (_req, res, _next) => {
    res.status(200).json({
        success: true,
        message: 'ok',
    });
});
if (hasClientBuild) {
    app.use(express.static(clientDistPath));
}
app.use((_error, _req, res, _next) => {
    res.status(500).json({
        success: false,
        error: 'Server internal error',
    });
});
app.use((req, res) => {
    if (hasClientBuild && req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(clientDistPath, 'index.html'));
        return;
    }
    res.status(404).json({
        success: false,
        error: 'API not found',
    });
});
export default app;
