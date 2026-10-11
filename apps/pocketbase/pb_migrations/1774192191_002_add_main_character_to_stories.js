/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("stories");

  const existing = collection.fields.getByName("main_character");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("main_character"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "main_character",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("stories");
  collection.fields.removeByName("main_character");
  return app.save(collection);
})