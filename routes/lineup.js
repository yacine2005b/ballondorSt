const express = require('express');
const router = express.Router();
const Lineup = require('../models/lineup');
const formations = require("../utils/formation");


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

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}
router.get('/', requireLogin, (req, res) => {
  res.render('lineup', {
    title: 'Choose Your Lineup',
    formations,
    players,
    error: null,
    currentUser: req.session.user,
  });
});

// POST INEUP
router.post('/', requireLogin, async (req, res) => {
  const { formation } = req.body;
  const slots = formations[formation];

  if (!slots) {
    return res.render('lineup', {
      title: 'Choose Your Lineup',
      formations,
      players,
      error: 'Invalid formation selected.',
      currentUser: req.session.user,
    });
  }

  const assigned = {};
  for (const slot of slots) {
    const player = req.body[slot.position];
    if (!player) {
      return res.render('lineup', {
        title: 'Choose Your Lineup',
        formations,
        players,
        error: `You must assign a player to ${slot.position}.`,
        currentUser: req.session.user,
      });
    }
    assigned[slot.position] = player;
  }

  const selectedNames = Object.values(assigned);
  const hasDuplicates = new Set(selectedNames).size !== selectedNames.length;

  if (hasDuplicates) {
    return res.render('lineup', {
      title: 'Choose Your Lineup',
      formations,
      players,
      error: 'Each player must be unique.',
      currentUser: req.session.user,
    });
  }

  await Lineup.findOneAndUpdate(
    { user: req.session.user.id },
    { formation, players: assigned },
    { upsert: true }
  );

  res.redirect('/lineup/summary');
});

// GET → Show user lineup
router.get('/summary', requireLogin, async (req, res) => {
  const lineup = await Lineup.findOne({ user: req.session.user.id });
  if (!lineup) return res.redirect('/lineup');


  const playerMap = lineup.players instanceof Map
    ? Object.fromEntries(lineup.players)
    : lineup.players;

  res.render('lineup-summary', {
    title: 'Your Lineup Summary',
    formation: lineup.formation,
    positions: formations[lineup.formation],
    playerMap,
    players,
    currentUser: req.session.user,
  });
});


router.post('/:id/comments', async (req, res) => {
  const lineup = await Lineup.findById(req.params.id);
  if (!lineup) return res.status(404).send('Lineup not found.');

  lineup.comments.push({
    user: req.session.user.id, 
    text: req.body.text
  });

  await lineup.save();
   
  res.redirect('/lineup/all');
});

router.get('/all', async (req, res) => {
  try {
    const lineups = await Lineup.find({})
      .populate('user', 'email')
      .populate('comments.user', 'email') 
      .sort({ _id: -1 });

    res.render('lineup/all', { lineups, formations, allPlayers: players, currentUser: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
module.exports = router;