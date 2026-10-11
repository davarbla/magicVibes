import express from 'express';
import PDFDocument from 'pdfkit';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/generate-pdf', async (req, res) => {
  const { storyId, userEmail } = req.body;

  if (!storyId || !userEmail) {
    return res.status(400).json({
      error: 'Missing required fields: storyId, userEmail',
    });
  }

  logger.info(`Generating PDF for story ${storyId}`);

  // Fetch story from PocketBase
  const story = await pb.collection('stories').getOne(storyId);

  if (!story) {
    throw new Error(`Story with ID ${storyId} not found`);
  }

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${story.title || 'story'}.pdf"`);

  // Pipe PDF to response
  doc.pipe(res);

  // Add title
  doc.fontSize(24).font('Helvetica-Bold').text(story.title || 'Untitled Story', {
    align: 'center',
  });

  doc.moveDown(0.5);

  // Add metadata section
  doc.fontSize(11).font('Helvetica').fillColor('#666666');

  if (story.childName) {
    doc.text(`Child's Name: ${story.childName}`);
  }
  if (story.childAge) {
    doc.text(`Age: ${story.childAge} years old`);
  }
  if (story.location) {
    doc.text(`Location: ${story.location}`);
  }
  if (story.mainCharacter) {
    doc.text(`Main Character: ${story.mainCharacter}`);
  }
  if (story.valueLesson) {
    doc.text(`Value Lesson: ${story.valueLesson}`);
  }

  doc.moveDown(1);

  // Add horizontal line separator
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  doc.moveDown(1);

  // Add story content
  doc.fontSize(12).font('Helvetica').fillColor('#000000');
  doc.text(story.story || '', {
    align: 'justify',
    lineGap: 5,
  });

  doc.moveDown(2);

  // Add footer with generation info
  doc.fontSize(9).fillColor('#999999');
  doc.text(`Generated on ${new Date().toLocaleDateString()} for ${userEmail}`, {
    align: 'center',
  });

  // Finalize PDF
  doc.end();

  logger.info(`PDF generated successfully for story ${storyId}`);
});

router.post('/send-story-email', async (req, res) => {
  const { storyId, recipientEmail, userId } = req.body;

  logger.info(`[send-story-email] Received request with storyId: "${storyId}", recipientEmail: "${recipientEmail}", userId: "${userId}"`);

  // Validate required fields
  if (!storyId || !recipientEmail) {
    logger.warn(`[send-story-email] Missing required fields - storyId: ${storyId}, recipientEmail: ${recipientEmail}`);
    return res.status(400).json({
      error: 'Missing required fields: storyId, recipientEmail',
    });
  }

  // Validate email format
  if (!emailRegex.test(recipientEmail)) {
    logger.warn(`[send-story-email] Invalid email format: ${recipientEmail}`);
    return res.status(400).json({
      error: 'Invalid email format',
    });
  }

  // Verify storyId is a valid string and not null/undefined
  if (typeof storyId !== 'string' || storyId.trim() === '') {
    logger.error(`[send-story-email] Invalid storyId type or empty string. Type: ${typeof storyId}, Value: "${storyId}"`);
    throw new Error('Story ID must be a non-empty string');
  }

  logger.info(`[send-story-email] Fetching story with ID: "${storyId}" (type: ${typeof storyId}, length: ${storyId.length})`);

  // Fetch story from PocketBase
  let story;
  try {
    logger.debug(`[send-story-email] Calling pb.collection('stories').getOne("${storyId}")`);
    story = await pb.collection('stories').getOne(storyId);
    logger.info(`[send-story-email] Successfully retrieved story: ${storyId}`);
  } catch (error) {
    logger.error(`[send-story-email] Failed to fetch story with ID "${storyId}". Error: ${error.message}`, {
      storyId,
      errorCode: error.code,
      errorStatus: error.status,
    });
    throw new Error(`Story not found`);
  }

  if (!story) {
    logger.error(`[send-story-email] Story query returned null/undefined for storyId: "${storyId}"`);
    throw new Error(`Story not found`);
  }

  logger.info(`[send-story-email] Story retrieved successfully. Title: "${story.title}", ID: ${story.id}`);

  if (!story.title || !story.story) {
    logger.error(`[send-story-email] Story ${storyId} is missing required fields. Title: ${story.title}, Story content exists: ${!!story.story}`);
    throw new Error(`Story ${storyId} is missing required fields: title or story content`);
  }

  logger.info(`[send-story-email] Preparing to queue email for story "${story.title}" to ${recipientEmail}`);

  // Format story content as HTML
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h1 style="color: #2c3e50; margin-bottom: 20px;">${escapeHtml(story.title)}</h1>
      <p style="white-space: pre-wrap; text-align: justify;">${escapeHtml(story.story)}</p>
    </div>
  `;

  const subject = `A Story for You: ${story.title}`;

  logger.debug(`[send-story-email] Email subject: "${subject}"`);
  logger.debug(`[send-story-email] Email HTML length: ${htmlBody.length} characters`);

  // Create email queue record in PocketBase
  logger.info(`[send-story-email] Creating email queue record`);

  const queueRecord = await pb.collection('email_queue').create({
    recipientEmail,
    subject,
    htmlBody,
    sent: false,
  });

  logger.info(`[send-story-email] Email queued successfully. Queue record ID: ${queueRecord.id}, recipient: ${recipientEmail}, story: "${story.title}"`);

  res.json({
    success: true,
    message: 'Email queued successfully',
    storyTitle: story.title,
    recipientEmail,
  });
});

// Helper function to escape HTML special characters
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export default router;