const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const validateEmail = (email) => {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
}

const UserSchema = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { 
    type: String, 
    trim: true,
    lowercase: true,
    unique: true,
    required: true,
    validate: [validateEmail, 'Please fill a valid email address'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
  },
  hash: { type: String, required: true },
  salt: { type: String, required: true },
  membership: { type: String, default: 'guest' },
  admin: { type: String },
});

module.exports = mongoose.model('User', UserSchema);
