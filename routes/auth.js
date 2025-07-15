const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// GET register form
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register', error: null });
});

// POST register
router.post('/register', async (req, res) => {
  try {
    let { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.render('register', {
        title: 'Register',
        error: 'Email and password are required.',
      });
    }

    // Normalize input
    email = email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', {
        title: 'Register',
        error: 'User already exists with that email.',
      });
    }

    // Hash password and save
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // Set session and redirect
    req.session.user = { id: newUser._id, email: newUser.email };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('register', {
      title: 'Register',
      error: 'Something went wrong. Please try again.',
    });
  }
});

// GET login form
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null });
});

// POST login
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.render('login', {
        title: 'Login',
        error: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email });
    const isMatch = user && (await bcrypt.compare(password, user.password));

    if (!isMatch) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid credentials.',
      });
    }

    req.session.user = { id: user._id, email: user.email };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', {
      title: 'Login',
      error: 'Something went wrong. Please try again.',
    });
  }
});

// GET logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;
