/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("stories");

  const existing = collection.fields.getByName("child_age");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("child_age"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "child_age",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("stories");
  collection.fields.removeByName("child_age");
  return app.save(collection);
})