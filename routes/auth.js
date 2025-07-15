const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// GET register form
router.get('/register', (req, res) => {
  res.render('register', { error: null,title: 'Register' });
});

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('register', { title: 'Register', error: 'Email and password are required.' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render('register', { title: 'Register', error: 'User already exists with that email.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashed });
  await newUser.save();

  req.session.user = { id: newUser._id, email: newUser.email };
  res.redirect('/');
});


// GET login form
router.get('/login', (req, res) => {
  res.render('login', { error: null ,title: 'Login' });
});

// POST login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { title: 'Login', error: 'Email and password are required.' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.render('login', { title: 'Login', error: 'Invalid credentials.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.render('login', { title: 'Login', error: 'Invalid credentials.' });
  }

  req.session.user = { id: user._id, email: user.email };
  res.redirect('/');
});

module.exports = router;
