import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/', async (req, res) => {
  const { testEmail } = req.query;

  if (!testEmail) {
    return res.status(400).json({
      error: 'Missing required query parameter: testEmail',
      example: '/email-diagnostics?testEmail=test@example.com',
    });
  }

  // Validate email format
  if (!emailRegex.test(testEmail)) {
    logger.warn(`[email-diagnostics] Invalid email format provided: ${testEmail}`);
    return res.status(400).json({
      error: 'Invalid email format',
      providedEmail: testEmail,
    });
  }

  const diagnosticId = `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const diagnosticLog = [];

  const logStep = (step, status, details = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      step,
      status,
      ...details,
    };
    diagnosticLog.push(entry);
    logger.info(`[email-diagnostics] [${diagnosticId}] ${step}: ${status}`, details);
  };

  logStep('INITIALIZATION', 'started', {
    diagnosticId,
    testEmail,
    timestamp: new Date().toISOString(),
  });

  // Step 1: Verify PocketBase connection
  logStep('POCKETBASE_CONNECTION', 'attempting', {
    pbUrl: process.env.POCKETBASE_URL || 'not configured',
  });

  try {
    const pbHealth = await pb.health.check();
    logStep('POCKETBASE_CONNECTION', 'success', {
      pbUrl: process.env.POCKETBASE_URL,
      healthStatus: pbHealth.code,
    });
  } catch (pbError) {
    logStep('POCKETBASE_CONNECTION', 'failed', {
      errorMessage: pbError.message,
      errorCode: pbError.code,
      errorStatus: pbError.status,
    });
    throw new Error(`PocketBase connection failed: ${pbError.message}`);
  }

  // Step 2: Check if email collection exists
  logStep('EMAIL_COLLECTION_CHECK', 'attempting', {
    collectionName: 'email_queue',
  });

  try {
    const collections = await pb.collections.getFullList();
    const emailQueueExists = collections.some((c) => c.name === 'email_queue');

    if (emailQueueExists) {
      logStep('EMAIL_COLLECTION_CHECK', 'success', {
        collectionName: 'email_queue',
        exists: true,
      });
    } else {
      logStep('EMAIL_COLLECTION_CHECK', 'warning', {
        collectionName: 'email_queue',
        exists: false,
        message: 'email_queue collection not found - emails may not be queued',
      });
    }
  } catch (collectionError) {
    logStep('EMAIL_COLLECTION_CHECK', 'failed', {
      errorMessage: collectionError.message,
      errorCode: collectionError.code,
    });
    throw new Error(`Failed to check email collection: ${collectionError.message}`);
  }

  // Step 3: Attempt to queue a test email
  logStep('EMAIL_QUEUE_CREATION', 'attempting', {
    recipientEmail: testEmail,
    subject: 'Email Diagnostics Test',
  });

  let queueRecord;
  try {
    queueRecord = await pb.collection('email_queue').create({
      recipientEmail: testEmail,
      subject: 'Email Diagnostics Test - Ignore this message',
      htmlBody: `<p>This is a test email from the email diagnostics endpoint.</p>
             <p>Diagnostic ID: ${diagnosticId}</p>
             <p>Timestamp: ${new Date().toISOString()}</p>
             <p>If you received this email, the email delivery system is working correctly.</p>`,
      sent: false,
    });

    logStep('EMAIL_QUEUE_CREATION', 'success', {
      queueRecordId: queueRecord.id,
      recipientEmail: testEmail,
      subject: queueRecord.subject,
      created: queueRecord.created,
    });
  } catch (queueError) {
    logStep('EMAIL_QUEUE_CREATION', 'failed', {
      errorMessage: queueError.message,
      errorCode: queueError.code,
      errorStatus: queueError.status,
    });
    throw new Error(`Failed to queue test email: ${queueError.message}`);
  }

  // Step 4: Verify queue record was created
  logStep('EMAIL_QUEUE_VERIFICATION', 'attempting', {
    queueRecordId: queueRecord.id,
  });

  try {
    const verifiedRecord = await pb.collection('email_queue').getOne(queueRecord.id);
    logStep('EMAIL_QUEUE_VERIFICATION', 'success', {
      queueRecordId: verifiedRecord.id,
      recipientEmail: verifiedRecord.recipientEmail,
      sent: verifiedRecord.sent,
      created: verifiedRecord.created,
    });
  } catch (verifyError) {
    logStep('EMAIL_QUEUE_VERIFICATION', 'failed', {
      errorMessage: verifyError.message,
      errorCode: verifyError.code,
    });
    throw new Error(`Failed to verify queued email: ${verifyError.message}`);
  }

  // Step 5: Test password reset email (optional, only if email exists in users collection)
  logStep('PASSWORD_RESET_TEST', 'attempting', {
    testEmail,
  });

  try {
    // Attempt to request password reset - this will trigger PocketBase email hooks
    await pb.collection('users').requestPasswordReset(testEmail);
    logStep('PASSWORD_RESET_TEST', 'success', {
      testEmail,
      message: 'Password reset email request sent to PocketBase',
    });
  } catch (resetError) {
    // This is expected if the email doesn't exist in users collection
    logStep('PASSWORD_RESET_TEST', 'info', {
      testEmail,
      message: 'Password reset request processed (email may not exist in users collection)',
      errorMessage: resetError.message,
    });
  }

  logStep('DIAGNOSTICS_COMPLETE', 'success', {
    diagnosticId,
    totalSteps: diagnosticLog.length,
    timestamp: new Date().toISOString(),
  });

  // Return comprehensive diagnostic report
  res.json({
    success: true,
    diagnosticId,
    timestamp: new Date().toISOString(),
    testEmail,
    summary: {
      pbConnected: true,
      emailQueuedSuccessfully: true,
      passwordResetAttempted: true,
    },
    steps: diagnosticLog,
    recommendations: [
      'Check PocketBase email settings in Admin UI',
      'Verify SMTP configuration in PocketBase settings',
      'Check email_queue collection for pending emails',
      'Review PocketBase logs for email hook execution',
      'Verify email_queue_sender.pb.js hook is enabled',
    ],
  });
});

export default router;