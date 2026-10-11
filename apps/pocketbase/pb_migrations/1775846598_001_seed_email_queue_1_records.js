/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("email_queue");

  const record0 = new Record(collection);
    record0.set("recipientEmail", "test@example.com");
    record0.set("subject", "Test Email");
    record0.set("htmlBody", "<h1>Test</h1>");
    record0.set("sent", false);
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})