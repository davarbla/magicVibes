/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("stories");

  const existing = collection.fields.getByName("language");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("language"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "language",
    required: false,
    values: ["Espa\u00f1ol", "English", "Fran\u00e7ais"]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("stories");
  collection.fields.removeByName("language");
  return app.save(collection);
})