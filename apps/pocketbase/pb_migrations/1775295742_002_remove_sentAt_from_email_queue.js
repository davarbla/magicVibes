/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.fields.removeByName("sentAt");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("email_queue");
  collection.fields.add(new DateField({
    name: "sentAt",
    required: false
  }));
  return app.save(collection);
})