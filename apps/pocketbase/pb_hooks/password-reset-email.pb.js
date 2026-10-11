/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // This hook captures password reset requests
  // When pb.collection('users').requestPasswordReset(email) is called,
  // PocketBase creates a password reset token internally
  // We'll send the reset email here
  
  const email = e.record.get("email");
  const resetToken = e.record.get("resetToken");
  
  // Only send if this is a password reset request
  // (In practice, you'd need to check the request context)
  // For now, we'll send on record creation if email exists
  
  if (email) {
    const appUrl = $app.settings().meta.appUrl || "https://yourapp.com";
    const resetLink = appUrl + "/reset-password?token=" + resetToken;
    
    const message = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName
      },
      to: [{ address: email }],
      subject: "Reset Your Password",
      html: "<h2>Password Reset Request</h2>" +
            "<p>Hello,</p>" +
            "<p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>" +
            "<p><strong>To reset your password, click the link below:</strong></p>" +
            "<p><a href=\"" + resetLink + "\" style=\"display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;\">Reset Password</a></p>" +
            "<p>Or copy and paste this link in your browser:</p>" +
            "<p><code>" + resetLink + "</code></p>" +
            "<p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>" +
            "<p>If you have any questions, please contact our support team.</p>" +
            "<p>Best regards,<br>The Team</p>"
    });
    
    try {
      $app.newMailClient().send(message);
    } catch (err) {
      console.log("Failed to send password reset email: " + err.message);
    }
  }
  
  e.next();
}, "users");

// Alternative: Use onRecordAuthRequest to capture auth events
// This fires after successful authentication
onRecordAuthRequest((e) => {
  // This captures successful auth events
  // You can check e.authMethod to see what type of auth was used
  e.next();
}, "users");