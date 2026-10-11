/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  try {
    // Get the story record details
    const storyTitle = e.record.get("title");
    const storyId = e.record.id;
    const userId = e.record.get("user_id");
    const childName = e.record.get("child_name") || "your child";
    
    // Only send email if we have a user_id to look up
    if (!userId) {
      e.next();
      return;
    }
    
    // Find the user record to get their email
    const user = $app.findRecordById("users", userId);
    if (!user || !user.email()) {
      e.next();
      return;
    }
    
    // Create and send the email
    const message = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName
      },
      to: [{ address: user.email() }],
      subject: "New Story Created: " + storyTitle,
      html: "<h2>Story Created Successfully</h2>" +
            "<p>A new story has been created for " + childName + ".</p>" +
            "<p><strong>Story Title:</strong> " + storyTitle + "</p>" +
            "<p><strong>Story ID:</strong> " + storyId + "</p>" +
            "<p>You can view and manage your stories in your account.</p>"
    });
    
    $app.newMailClient().send(message);
  } catch (error) {
    // Log the error but don't throw - we don't want email failures to block story creation
    console.log("Email notification failed for story " + e.record.id + ": " + error.message);
  }
  
  // CRITICAL: Always call e.next() to continue execution
  e.next();
}, "stories");