import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  logger.info('[test] GET /test endpoint called');
  res.json({
    status: 'ok',
    message: 'API server is working',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3001,
  });
});

export default router;