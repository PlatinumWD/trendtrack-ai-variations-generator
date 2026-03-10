import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from '@config/env';
import { aiRoutes } from '@routes/ai.routes';
import { errorMiddleware } from '@middleware/error.middleware';

const app = express();

app.use(cors({
  origin: env.CLIENT_URL,
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/generated', express.static(path.join(process.cwd(), 'generated')));

// Routes
app.use('/api/ai', aiRoutes);

// Error Handling
app.use(errorMiddleware);

export default app;
