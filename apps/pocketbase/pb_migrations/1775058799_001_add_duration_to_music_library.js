/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("music_library");

  const existing = collection.fields.getByName("duration");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("duration"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "duration",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("music_library");
  collection.fields.removeByName("duration");
  return app.save(collection);
})