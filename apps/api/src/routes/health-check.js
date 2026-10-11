import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  logger.info('[health-check] GET /health endpoint called');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;