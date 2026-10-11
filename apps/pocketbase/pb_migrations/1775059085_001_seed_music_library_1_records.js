/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("music_library");

  const record0 = new Record(collection);
    record0.set("title", "Schema Verification Test");
    const record0_user_idLookup = app.findFirstRecordByFilter("users", "id != ''");
    if (!record0_user_idLookup) { throw new Error("Lookup failed for user_id: no record in 'users' matching \"id != ''\""); }
    record0.set("user_id", record0_user_idLookup.id);
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