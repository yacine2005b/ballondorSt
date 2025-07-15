const express = require('express');
const router = express.Router();
const Vote = require('../models/vote');
require('dotenv').config();

// 🧍‍♂️ List of players (fallback to empty image if env var missing)
const players = [
  { name: "yacine", img: process.env.IMG_YACINE || "" },
  { name: "abdou", img: process.env.IMG_ABDOU || "" },
  { name: "alilou", img: process.env.IMG_ALILOU || "" },
  { name: "aymen sn9ol", img: process.env.IMG_AYMEN_SN9OL || "" },
  { name: "chico boy", img: process.env.IMG_CHICO || "" },
  { name: "htt", img: process.env.IMG_HTT || "" },
  { name: "imad", img: process.env.IMG_IMAD || "" },
  { name: "nasro", img: process.env.IMG_NASRO || "" },
  { name: "rami", img: process.env.IMG_RAMI || "" },
  { name: "rodri", img: process.env.IMG_RODRI || "" },
  { name: "aymen ", img: process.env.IMG_AYMEN || "" },
  { name: "wassim", img: process.env.IMG_WASSIM || "" },
  { name: "islam", img: process.env.IMG_ISLAM || "" },
  { name: "souhail", img: process.env.IMG_SOUHAIL || "" },
  { name: "moncef", img: process.env.IMG_MONCEF || "" },
  { name: "ahmed", img: process.env.IMG_AHMED || "" },
  { name: "Khaled", img: process.env.IMG_KHALED || "" },
];

// 🔐 Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// 🧮 Score calculator
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

// 🗳 GET vote page
router.get('/', requireLogin, async (req, res) => {
  try {
    const vote = await Vote.findOne({ user: req.session.user.id });

    res.render('index', {
      title: 'Vote',
      players,
      userVote: vote || {},
      error: null,
      currentUser: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// 🗳 POST vote
router.post('/', requireLogin, async (req, res) => {
  try {
    const votes = req.body;

    const rankToPlayer = {};
    const selectedPlayers = new Set();

    for (const [player, rank] of Object.entries(votes)) {
      if (['first', 'second', 'third'].includes(rank)) {
        if (rankToPlayer[rank]) {
          return res.render('index', {
            title: 'Vote',
            players,
            userVote: votes,
            error: `You selected two players for ${rank} place.`,
            currentUser: req.session.user
          });
        }

        if (selectedPlayers.has(player)) {
          return res.render('index', {
            title: 'Vote',
            players,
            userVote: votes,
            error: `You selected the same player more than once.`,
            currentUser: req.session.user
          });
        }

        rankToPlayer[rank] = player;
        selectedPlayers.add(player);
      }
    }

    const { first, second, third } = rankToPlayer;

    if (!first || !second || !third) {
      return res.render('index', {
        title: 'Vote',
        players,
        userVote: votes,
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
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// 📊 GET leaderboard
router.get('/leaderboard', requireLogin, async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// 📃 GET votes summary (admin-like view)
router.get('/votes-summary', requireLogin, async (req, res) => {
  try {
    const votes = await Vote.find().populate('user', 'email');

    res.render('votes-summary', {
      title: 'Votes Summary',
      votes,
      currentUser: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
