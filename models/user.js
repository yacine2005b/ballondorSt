const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true, trim: true, required: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
});

// Cascade delete related data (votes + lineups)
userSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Vote = require('./vote');
    const Lineup = require('./lineup');

    await Vote.deleteMany({ user: doc._id });
    await Lineup.deleteMany({ user: doc._id });
  }
});

// Password comparison helper
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
