/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("email_queue");

  const existing = collection.fields.getByName("sentAt");
  if (existing) {
    if (existing.type === "date") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("sentAt"); // exists with wrong type, remove first
  }

  collection.fields.add(new DateField({
    name: "sentAt",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.fields.removeByName("sentAt");
  return app.save(collection);
})