/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("music_library");
  collection.fields.removeByName("user_id");
  return app.save(collection);
}, (app) => {

  const _pb_users_auth_Collection = app.findCollectionByNameOrId("_pb_users_auth_");
  const collection = app.findCollectionByNameOrId("music_library");
  collection.fields.add(new RelationField({
    name: "user_id",
    required: true,
    collectionId: _pb_users_auth_Collection.id,
    maxSelect: 1,
    cascadeDelete: false
  }));
  return app.save(collection);
})