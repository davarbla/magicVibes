/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("stories");

  const existing = collection.fields.getByName("child_name");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("child_name"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "child_name",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("stories");
  collection.fields.removeByName("child_name");
  return app.save(collection);
})