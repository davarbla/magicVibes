// Email Queue Sender Hook
// Automatically sends emails when records are added to email_queue collection

onRecordAfterCreateSuccess((e) => {
  try {
    // Get email details from the created record
    const recipientEmail = e.record.getString("recipientEmail");
    const subject = e.record.getString("subject");
    const htmlBody = e.record.getString("htmlBody");
    
    console.log("Email queue record created:", e.record.id);
    console.log("Recipient:", recipientEmail);
    console.log("Subject:", subject);
    
    // Validate required fields
    if (!recipientEmail || !subject || !htmlBody) {
      console.error("Missing required email fields:", {
        recipientEmail: !!recipientEmail,
        subject: !!subject,
        htmlBody: !!htmlBody
      });
      e.next();
      return;
    }
    
    // Get sender settings from app configuration
    const senderAddress = $app.settings().meta.senderAddress;
    const senderName = $app.settings().meta.senderName;
    
    console.log("Sender address:", senderAddress);
    console.log("Sender name:", senderName);
    
    // Validate sender configuration
    if (!senderAddress) {
      console.error("Sender address not configured in PocketBase settings");
      e.next();
      return;
    }
    
    // Construct the email message
    const message = new MailerMessage({
      from: {
        address: senderAddress,
        name: senderName || "Story App"
      },
      to: [{ address: recipientEmail }],
      subject: subject,
      html: htmlBody
    });
    
    console.log("Attempting to send email...");
    
    // Send the email
    $app.newMailClient().send(message);
    
    console.log("Email sent successfully to:", recipientEmail);
    
    // Update the email_queue record to mark as sent
    e.record.set("sent", true);
    e.record.set("sentAt", new Date().toISOString());
    $app.save(e.record);
    
    console.log("Email queue record updated as sent");
    
  } catch (error) {
    console.error("Error in email_queue_sender hook:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  }
  
  // Always call e.next() to continue execution chain
  e.next();
}, "email_queue");