const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true, trim: true, required: true },
  password: { type: String, required: true }
});

// Delete votes when a user is removed
userSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Vote = require('../models/vote');
    await Vote.deleteMany({ user: doc._id });
  }
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
