/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("email_queue");

  const existing = collection.fields.getByName("error");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("error"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "error",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.fields.removeByName("error");
  return app.save(collection);
})