/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("stories");

  const existing = collection.fields.getByName("sound_metadata");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("sound_metadata"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "sound_metadata",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("stories");
  collection.fields.removeByName("sound_metadata");
  return app.save(collection);
})