/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("stories");
  const field = collection.fields.getByName("content");
  field.name = "story";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("stories");
  const field = collection.fields.getByName("story");
  field.name = "content";
  return app.save(collection);
})