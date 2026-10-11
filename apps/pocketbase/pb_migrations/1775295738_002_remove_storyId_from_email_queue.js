/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.fields.removeByName("storyId");
  return app.save(collection);
}, (app) => {

  const pbc_3084478122Collection = app.findCollectionByNameOrId("pbc_3084478122");
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.fields.add(new RelationField({
    name: "storyId",
    required: true,
    collectionId: pbc_3084478122Collection.id,
    maxSelect: 1,
    cascadeDelete: false
  }));
  return app.save(collection);
})