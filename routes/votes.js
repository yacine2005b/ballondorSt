const express = require('express');
const router = express.Router();
const Vote = require('../models/vote');
require('dotenv').config(); 

const players = [
  { name: "yacine", img: process.env.IMG_YACINE },
  { name: "abdou", img: process.env.IMG_ABDOU },
  { name: "alilou", img: process.env.IMG_ALILOU },
  { name: "aymen sn9ol", img: process.env.IMG_AYMEN_SN9OL },
  { name: "chico boy", img: process.env.IMG_CHICO },
  { name: "htt", img: process.env.IMG_HTT },
  { name: "imad", img: process.env.IMG_IMAD },
  { name: "nasro", img: process.env.IMG_NASRO },
  { name: "rami", img: process.env.IMG_RAMI },
  { name: "rodri", img: process.env.IMG_RODRI },
  { name: "aymen ", img: process.env.IMG_AYMEN },
  { name: "wassim", img: process.env.IMG_WASSIM },
  { name: "islam", img: process.env.IMG_ISLAM },
  { name: "souhail", img: process.env.IMG_SOUHAIL },
  { name: "moncef", img: process.env.IMG_MONCEF },
    { name: "ahmed", img: process.env.IMG_AHMED },
    { name: "Khaled", img: process.env.IMG_KHALED },
];

// 🔐 Middleware to protect routes
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// 🧮 Calculate total score based on all votes
function calculateScores(votes) {
  const scores = {};
  players.forEach(p => scores[p.name] = 0);

  votes.forEach(vote => {
    if (vote.first) scores[vote.first] += 5;
    if (vote.second) scores[vote.second] += 3;
    if (vote.third) scores[vote.third] += 1;
  });

  return scores;
}

// 📄 GET Vote page
router.get('/', requireLogin, async (req, res) => {
  const vote = await Vote.findOne({ user: req.session.user.id });

  res.render('index', {
    title: 'Vote',
    players,
    userVote: vote || {},
    error: null,
    currentUser: req.session.user
  });
});

// 📨 POST Vote submission
router.post('/', requireLogin, async (req, res) => {
  const votes = req.body; // { 'yacine': 'first', 'abdou': 'second', ... }

  const rankToPlayer = {};

  for (const [player, rank] of Object.entries(votes)) {
    if (['first', 'second', 'third'].includes(rank)) {
      if (rankToPlayer[rank]) {
        // Duplicate rank detected
        return res.render('index', {
          title: 'Vote',
          players,
          userVote: {}, // Optional: you can send back the votes object here
          error: `You selected two players for ${rank} place.`,
          currentUser: req.session.user
        });
      }
      rankToPlayer[rank] = player;
    }
  }

  const first = rankToPlayer.first || null;
  const second = rankToPlayer.second || null;
  const third = rankToPlayer.third || null;

  if (!first || !second || !third) {
    return res.render('index', {
      title: 'Vote',
      players,
      userVote: {},
      error: 'Please select exactly 3 different players.',
      currentUser: req.session.user
    });
  }

  await Vote.findOneAndUpdate(
    { user: req.session.user.id },
    { first, second, third },
    { upsert: true }
  );

  res.redirect('/leaderboard');
});

// 📊 GET Leaderboard page
router.get('/leaderboard', requireLogin, async (req, res) => {
  const votes = await Vote.find();
  const scores = calculateScores(votes);

  const leaderboard = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([player, score]) => ({ player, score }));

  res.render('leaderboard', {
    title: 'Leaderboard',
    leaderboard,
    players
  });
});

router.get('/votes-summary', requireLogin, async (req, res) => {
 
  const votes = await Vote.find().populate('user', 'email'); // populate user email only

  res.render('votes-summary', {
    title: 'Votes Summary',
    votes,
    currentUser: req.session.user,
  });
});

module.exports = router;
