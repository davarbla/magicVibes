/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("music_library");
  collection.listRule = "";
  collection.viewRule = "";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  collection.deleteRule = "@request.auth.role = 'admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("music_library");
  collection.listRule = "user_id = @request.auth.id";
  collection.viewRule = "user_id = @request.auth.id";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "user_id = @request.auth.id";
  collection.deleteRule = "user_id = @request.auth.id";
  return app.save(collection);
})