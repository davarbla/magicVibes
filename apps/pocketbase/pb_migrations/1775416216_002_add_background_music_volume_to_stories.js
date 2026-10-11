/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("stories");

  const existing = collection.fields.getByName("background_music_volume");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("background_music_volume"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "background_music_volume",
    required: false,
    min: 0,
    max: 100
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("stories");
  collection.fields.removeByName("background_music_volume");
  return app.save(collection);
})