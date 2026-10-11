import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  return typeof email === 'string' && emailRegex.test(email.trim());
}

/**
 * Validates that a string is not empty
 * @param {string} str - String to validate
 * @returns {boolean} - True if string is not empty
 */
function isNonEmptyString(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

router.post('/', async (req, res) => {
  const { recipientEmail, subject, htmlBody } = req.body;

  logger.info('[POST /email] Request received', {
    hasRecipientEmail: !!recipientEmail,
    hasSubject: !!subject,
    hasHtmlBody: !!htmlBody,
    recipientEmailType: typeof recipientEmail,
    subjectType: typeof subject,
    htmlBodyType: typeof htmlBody,
  });

  // ===== INPUT VALIDATION (400 errors are acceptable) =====
  if (!recipientEmail) {
    logger.warn('[POST /email] Missing required field: recipientEmail');
    return res.status(400).json({
      error: 'Missing required field: recipientEmail',
    });
  }

  if (!subject) {
    logger.warn('[POST /email] Missing required field: subject');
    return res.status(400).json({
      error: 'Missing required field: subject',
    });
  }

  if (!htmlBody) {
    logger.warn('[POST /email] Missing required field: htmlBody');
    return res.status(400).json({
      error: 'Missing required field: htmlBody',
    });
  }

  // Validate email format
  if (!isValidEmail(recipientEmail)) {
    logger.warn(`[POST /email] Invalid email format: ${recipientEmail}`, {
      recipientEmail,
      type: typeof recipientEmail,
    });
    return res.status(400).json({
      error: 'Invalid email format',
      providedEmail: recipientEmail,
    });
  }

  // Validate subject is not empty
  if (!isNonEmptyString(subject)) {
    logger.warn('[POST /email] Subject is empty or not a string', {
      subject,
      type: typeof subject,
    });
    return res.status(400).json({
      error: 'Subject must be a non-empty string',
    });
  }

  // Validate htmlBody is not empty
  if (!isNonEmptyString(htmlBody)) {
    logger.warn('[POST /email] HTML body is empty or not a string', {
      htmlBody: htmlBody ? htmlBody.substring(0, 50) : htmlBody,
      type: typeof htmlBody,
    });
    return res.status(400).json({
      error: 'HTML body must be a non-empty string',
    });
  }

  logger.info('[POST /email] All input validation passed', {
    recipientEmail: recipientEmail.trim(),
    subjectLength: subject.trim().length,
    htmlBodyLength: htmlBody.trim().length,
  });

  // ===== PREPARE PAYLOAD FOR POCKETBASE =====
  const payload = {
    recipientEmail: recipientEmail.trim(),
    subject: subject.trim(),
    htmlBody: htmlBody.trim(),
    sent: false,
  };

  logger.info('[POST /email] Prepared payload for PocketBase', {
    recipientEmail: payload.recipientEmail,
    subjectLength: payload.subject.length,
    htmlBodyLength: payload.htmlBody.length,
    sent: payload.sent,
    payloadKeys: Object.keys(payload),
  });

  // ===== CREATE EMAIL QUEUE RECORD IN POCKETBASE =====
  // Errors here will throw and bubble to errorMiddleware
  logger.info('[POST /email] Creating email queue record in PocketBase', {
    recipientEmail: payload.recipientEmail,
    subject: payload.subject,
  });

  let queueRecord;
  try {
    queueRecord = await pb.collection('email_queue').create(payload);

    logger.info('[POST /email] Email queue record created successfully', {
      queueRecordId: queueRecord.id,
      recipientEmail: queueRecord.recipientEmail,
      subject: queueRecord.subject,
      sent: queueRecord.sent,
      created: queueRecord.created,
    });
  } catch (pbError) {
    logger.error('[POST /email] PocketBase error when creating email queue record', {
      errorMessage: pbError.message,
      errorCode: pbError.code,
      errorStatus: pbError.status,
      errorData: pbError.data,
      payloadSent: payload,
      collectionName: 'email_queue',
    });

    // Re-throw the error so errorMiddleware catches it
    throw new Error(
      `Failed to queue email: ${pbError.message}. ` +
      `Please verify the email_queue collection exists and has the required fields: ` +
      `recipientEmail (email), subject (text), htmlBody (text), sent (bool).`
    );
  }

  // ===== RETURN SUCCESS RESPONSE =====
  res.json({
    success: true,
    message: 'Email queued successfully',
    queueRecordId: queueRecord.id,
    recipientEmail: queueRecord.recipientEmail,
    subject: queueRecord.subject,
    sent: queueRecord.sent,
    created: queueRecord.created,
  });
});

export default router;