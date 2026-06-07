import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/errorHandler.js';
import { formatResponse } from './utils/formatResponse.js';
import { indexRouter } from './routes/index.js';

const app = express();

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json(formatResponse('ShopSphere API is healthy and running'));
});

// Mounted Modular Routers
app.use('/api/v1', indexRouter);

// Error handling middleware
app.use(errorHandler);

export default app;
