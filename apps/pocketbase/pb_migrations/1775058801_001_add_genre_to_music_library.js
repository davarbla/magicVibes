/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("music_library");

  const existing = collection.fields.getByName("genre");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("genre"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "genre",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("music_library");
  collection.fields.removeByName("genre");
  return app.save(collection);
})