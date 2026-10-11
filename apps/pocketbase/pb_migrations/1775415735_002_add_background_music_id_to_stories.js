/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const audio_libraryCollection = app.findCollectionByNameOrId("audio_library");
  const collection = app.findCollectionByNameOrId("stories");

  const existing = collection.fields.getByName("background_music_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("background_music_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "background_music_id",
    required: false,
    collectionId: audio_libraryCollection.id,
    maxSelect: 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("stories");
  collection.fields.removeByName("background_music_id");
  return app.save(collection);
})