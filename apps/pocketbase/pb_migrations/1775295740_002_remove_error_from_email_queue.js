/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.fields.removeByName("error");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("email_queue");
  collection.fields.add(new TextField({
    name: "error",
    required: false,
    min: 0,
    max: 0
  }));
  return app.save(collection);
})