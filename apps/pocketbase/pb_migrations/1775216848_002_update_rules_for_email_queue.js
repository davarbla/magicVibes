/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.createRule = "@request.auth.id != '' || @request.headers.authorization != ''";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("email_queue");
  collection.createRule = "@request.auth.id != ''";
  return app.save(collection);
})