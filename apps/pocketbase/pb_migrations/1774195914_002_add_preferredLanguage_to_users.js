/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const existing = collection.fields.getByName("preferredLanguage");
  if (existing) {
    if (existing.type === "select") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("preferredLanguage"); // exists with wrong type, remove first
  }

  collection.fields.add(new SelectField({
    name: "preferredLanguage",
    required: false,
    values: ["Espa\u00f1ol", "English", "Fran\u00e7ais"]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("preferredLanguage");
  return app.save(collection);
})