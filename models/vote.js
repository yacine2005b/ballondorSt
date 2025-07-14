const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  first: String,
  second: String,
  third: String
}, { timestamps: true });

module.exports = mongoose.model('Vote', VoteSchema);
