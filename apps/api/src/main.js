import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/index.js';
import logger from './utils/logger.js';

console.log('🚀 API Server starting...');

const app = express();

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
  logger.info('Interrupted');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received');
  await new Promise(resolve => setTimeout(resolve, 3000));
  logger.info('Exiting');
  process.exit();
});

logger.info('Applying middleware...');

app.use(helmet());
logger.info('✓ Helmet middleware applied');

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
logger.info(`✓ CORS middleware applied (origin: ${process.env.CORS_ORIGIN})`);

app.use(morgan('combined'));
logger.info('✓ Morgan middleware applied');

app.use(express.json());
logger.info('✓ express.json() middleware applied');

app.use(express.urlencoded({ extended: true }));
logger.info('✓ express.urlencoded() middleware applied');

logger.info('Registering routes...');
app.use('/', routes());
logger.info('✓ Routes registered');

app.use(errorMiddleware);
logger.info('✓ Error middleware applied');

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3001;

logger.info(`PORT from environment: ${process.env.PORT}`);
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);

app.listen(port, () => {
  logger.info(`🚀 API Server running on http://localhost:${port}`);
  console.log(`✅ Server listening on port ${port}`);
});

export default app;