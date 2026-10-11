/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("music_library");
  collection.createRule = "@request.auth.id != ''";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("music_library");
  collection.createRule = "@request.auth.role = 'admin'";
  return app.save(collection);
})