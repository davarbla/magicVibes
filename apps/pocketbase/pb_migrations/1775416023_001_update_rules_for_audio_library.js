/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("audio_library");
  collection.listRule = "@request.auth.id != \"\"";
  collection.viewRule = "@request.auth.id != \"\"";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("audio_library");
  collection.listRule = "@request.auth.collectionName = \"admins\"";
  collection.viewRule = "@request.auth.collectionName = \"admins\"";
  return app.save(collection);
})