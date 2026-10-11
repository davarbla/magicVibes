/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.listRule = "@request.auth.role = \"admin\"";
  collection.viewRule = "@request.auth.role = \"admin\"";
  collection.createRule = "@request.auth.id != \"\" || @request.headers.authorization != \"\"";
  collection.updateRule = "@request.auth.role = \"admin\"";
  collection.deleteRule = "@request.auth.role = \"admin\"";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.createRule = "@request.auth.id != '' || @request.headers.authorization != ''";
  collection.listRule = "@request.auth.role = 'admin'";
  collection.viewRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  collection.deleteRule = "@request.auth.role = 'admin'";
  return app.save(collection);
})