import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Missing required field: email',
    });
  }

  // Validate email format
  if (!emailRegex.test(email)) {
    logger.warn(`[request-password-reset] Invalid email format: ${email}`);
    return res.status(400).json({
      error: 'Invalid email format',
    });
  }

  logger.info(`[request-password-reset] Processing password reset request for email: ${email}`);

  // Call PocketBase to request password reset
  // This sends a password reset email to the user
  await pb.collection('users').requestPasswordReset(email);

  logger.info(`[request-password-reset] Password reset email sent successfully to: ${email}`);

  // Return success response
  // Note: We don't reveal whether the email exists or not for security reasons
  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
});

router.post('/test-password-reset', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Missing required field: email',
    });
  }

  // Validate email format
  if (!emailRegex.test(email)) {
    logger.warn(`[test-password-reset] Invalid email format: ${email}`);
    return res.status(400).json({
      error: 'Invalid email format',
    });
  }

  logger.info(`[test-password-reset] Testing password reset for email: ${email}`);

  // Attempt to request password reset
  await pb.collection('users').requestPasswordReset(email);

  logger.info(`[test-password-reset] Password reset request successful for: ${email}`);

  res.json({
    success: true,
    message: 'Password reset request sent successfully',
    email,
    timestamp: new Date().toISOString(),
  });
});

export default router;