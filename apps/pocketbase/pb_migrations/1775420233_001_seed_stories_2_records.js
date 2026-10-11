/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("stories");
  
  // Find any existing user to use as the user_id
  let userId;
  try {
    const users = app.findCollectionByNameOrId("users");
    const existingUser = app.findFirstRecordByFilter(users.id, "id != ''");
    if (existingUser) {
      userId = existingUser.id;
    } else {
      console.log("No users found in database, skipping story seed");
      return;
    }
  } catch (e) {
    console.log("Error finding user: " + e.message + ", skipping story seed");
    return;
  }

  const record0 = new Record(collection);
    record0.set("user_id", userId);
    record0.set("title", "Missing Story 1");
    record0.set("story", "This is a placeholder story that was missing from the database.");
    record0.set("created_by", userId);
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.set("user_id", userId);
    record1.set("title", "Missing Story 2");
    record1.set("story", "This is another placeholder story that was referenced but missing from the database.");
    record1.set("created_by", userId);
  try {
    app.save(record1);
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