// Module Scope
const mongoose = require('mongoose');
const extend = require('extend');
let counterSchema;
let IdentityCounter;

// Initialize plugin by creating counter collection in database.
exports.initialize = function (connection) {
  try {
    IdentityCounter = mongoose.model('IdentityCounter');
  } catch (ex) {
    if (ex.name === 'MissingSchemaError') {
      // Create new counter schema.
      counterSchema = new mongoose.Schema({
        model: { type: String, require: true },
        field: { type: String, require: true },
        count: { type: Number, default: 0 }
      });

      // Create a unique index using the "field" and "model" fields.
      counterSchema.index({ field: 1, model: 1 }, { unique: true, required: true, index: -1 });

      // Create model using new schema.
      IdentityCounter = mongoose.model('IdentityCounter', counterSchema);
    }
    else
      throw ex;
  }
};

// The function to use when invoking the plugin on a custom schema.
exports.plugin = function (schema, options) {

  // If we don't have reference to the counterSchema or the IdentityCounter model then the plugin was most likely not
  // initialized properly so throw an error.
  if (!counterSchema || !IdentityCounter) throw new Error("mongoose-auto-increment has not been initialized");

  // Default settings and plugin scope variables.
  var settings = {
    model: null, // The model to configure the plugin for.
    field: '_id', // The field the plugin should track.
    startAt: 0, // The number the count should start at.
    incrementBy: 1, // The number by which to increment the count each time.
    unique: true // Should we create a unique index for the field
  },
  fields = {}, // A hash of fields to add properties to in Mongoose.
  ready = false; // True if the counter collection has been updated and the document is ready to be saved.

  switch (typeof(options)) {
    // If string, the user chose to pass in just the model name.
    case 'string':
      settings.model = options;
    break;
    // If object, the user passed in a hash of options.
    case 'object':
      extend(settings, options);
    break;
  }

  if (settings.model == null)
    throw new Error("model must be set");

  // Add properties for field in schema.
  fields[settings.field] = {
    type: Number,
    require: true
  };
  if (settings.field !== '_id')
    fields[settings.field].unique = settings.unique
  schema.add(fields);

  // Find the counter for this model and the relevant field.
  IdentityCounter.findOneAndUpdate(
    { model: settings.model, field: settings.field },
    { $setOnInsert: { count: settings.startAt - settings.incrementBy } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).then(() => { ready = true; }).catch(() => { ready = true; });

  // Declare a function to get the next counter for the model/schema.
  var nextCount = async function () {
    const counter = await IdentityCounter.findOne({
      model: settings.model,
      field: settings.field
    }).lean();
    return counter === null ? settings.startAt : counter.count + settings.incrementBy;
  };
  // Add nextCount as both a method on documents and a static on the schema for convenience.
  schema.method('nextCount', nextCount);
  schema.static('nextCount', nextCount);

  // Declare a function to reset counter at the start value - increment value.
  var resetCount = async function () {
    await IdentityCounter.findOneAndUpdate(
      { model: settings.model, field: settings.field },
      { count: settings.startAt - settings.incrementBy },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return settings.startAt;
  };
  // Add resetCount as both a method on documents and a static on the schema for convenience.
  schema.method('resetCount', resetCount);
  schema.static('resetCount', resetCount);

  // Every time documents in this schema are saved, run this logic.
  schema.pre('save', async function () {
    // Get reference to the document being saved.
    var doc = this;

    // Only do this if it is a new document (see http://mongoosejs.com/docs/api.html#document_Document-isNew)
    if (doc.isNew) {
      try {
        if (typeof doc[settings.field] === 'number') {
          await IdentityCounter.findOneAndUpdate(
            { model: settings.model, field: settings.field, count: { $lt: doc[settings.field] } },
            { count: doc[settings.field] },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
        } else {
          const updatedIdentityCounter = await IdentityCounter.findOneAndUpdate(
            { model: settings.model, field: settings.field },
            { $inc: { count: settings.incrementBy } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
          const count = updatedIdentityCounter ? updatedIdentityCounter.count : settings.startAt;
          doc[settings.field] = count;
        }
        return;
      } catch (err) {
        throw err;
      }
    }
  });
};
