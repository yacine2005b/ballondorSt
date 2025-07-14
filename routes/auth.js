const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// GET register form
router.get('/register', (req, res) => {
  res.render('register', { error: null,title: 'Register' });
});

// POST register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.render('register', { error: 'Email already exists' });

    const user = new User({ email, password });
    await user.save();
    req.session.user = { id: user._id, email: user.email };
    res.redirect('/');
  } catch {
    res.render('register', { error: 'Registration failed' });
  }
});

// GET login form
router.get('/login', (req, res) => {
  res.render('login', { error: null ,title: 'Login' });
});

// POST login
router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await user.comparePassword(req.body.password))) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  req.session.user = { id: user._id, email: user.email };
  res.redirect('/');
});

// GET logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
