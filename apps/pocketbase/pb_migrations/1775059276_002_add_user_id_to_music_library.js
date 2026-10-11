/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const pbc_3841632486Collection = app.findCollectionByNameOrId("pbc_3841632486");
  const collection = app.findCollectionByNameOrId("music_library");

  const existing = collection.fields.getByName("user_id");
  if (existing) {
    if (existing.type === "relation") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("user_id"); // exists with wrong type, remove first
  }

  collection.fields.add(new RelationField({
    name: "user_id",
    required: true,
    collectionId: pbc_3841632486Collection.id,
    maxSelect: 1,
    cascadeDelete: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("music_library");
  collection.fields.removeByName("user_id");
  return app.save(collection);
})