const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');

const MessageSchema = new Schema({
  title: { type: String },
  timestamp: { type: Date },
  text: { type: String },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
});

MessageSchema.virtual('timestamp_formatted').get(function() {
  return this.timestamp
    ? DateTime.fromJSDate(this.timestamp).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)
    : '';
});

module.exports = mongoose.model('Message', MessageSchema);
