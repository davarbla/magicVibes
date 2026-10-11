import express from 'express';
import healthCheckRouter from './health-check.js';
import testRouter from './test.js';
import storyRouter from './story.js';
import storiesRouter from './stories.js';
import authRouter from './auth.js';
import emailDiagnosticsRouter from './email-diagnostics.js';
import soundRouter from './sound.js';
import emailRouter from './email.js';

export default function routes() {
  const router = express.Router();

  router.use('/health', healthCheckRouter);
  router.use('/test', testRouter);
  router.use('/story', storyRouter);
  router.use('/stories', storiesRouter);
  router.use('/auth', authRouter);
  router.use('/email-diagnostics', emailDiagnosticsRouter);
  router.use('/sound', soundRouter);
  router.use('/email', emailRouter);

  return router;
}