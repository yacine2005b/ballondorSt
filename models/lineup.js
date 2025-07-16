const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const lineupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  formation: { type: String, required: true },
  players: {
    type: Map,
    of: String,
    required: true,
  },
  comments: [commentSchema] // ⬅️ Embedded comments
});

module.exports = mongoose.model('Lineup', lineupSchema);

