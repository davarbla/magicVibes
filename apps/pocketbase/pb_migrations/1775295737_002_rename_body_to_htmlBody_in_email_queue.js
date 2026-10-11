/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  const field = collection.fields.getByName("body");
  field.name = "htmlBody";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  const field = collection.fields.getByName("htmlBody");
  field.name = "body";
  return app.save(collection);
})