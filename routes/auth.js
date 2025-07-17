const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config(); 

// Render register page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register', error: null });
});

// Handle register POST
router.post('/register', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.render('register', {
        title: 'Register',
        error: 'Email and password are required.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', {
        title: 'Register',
        error: 'User already exists with that email.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      email,
      password: hashedPassword,
      verificationToken: token,
      isVerified: false,
    });

    await newUser.save();

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'yybouz1802@gmail.com',
        pass: process.env.APP_PASS,  
      },
    });

    const verifyUrl = `http://${req.headers.host}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: "ST Ballon d\'Or", 
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h3>Welcome to ST Ballon d'Or</h3>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}" target="_blank" style="color: #facc15;">Verify Email</a>
      `,
    });

    res.render('login', {
      title: 'Login',
      error: 'Verification email sent. Please check your inbox.',
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', {
      title: 'Register',
      error: 'Something went wrong. Please try again.',
    });
  }
});

// Render login page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', error: null });
});

// Handle login POST
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
    if (!user) {
      return res.render('login', {
        title: 'Login',
        error: 'No account found with this email.',
      });
    }

    if (!user.isVerified) {
      return res.render('login', {
        title: 'Login',
        error: 'Please verify your email before logging in.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        title: 'Login',
        error: 'Incorrect password.',
      });
    }

    req.session.user = { id: user._id, email: user.email };

    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', {
      title: 'Login',
      error: 'Something went wrong. Please try again.',
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/login');
  });
});

// Admin: View all users
router.get('/users', async (req, res) => {
  try {
    const allowedAdmins = ['ybouziane144@gmail.com', 'raoufammari213@gmail.com'];
    if (!req.session.user || !allowedAdmins.includes(req.session.user.email)) {
      return res.status(403).send('Access denied');
    }
    const users = await User.find({}, 'email _id isVerified');
    res.render('users', { title: 'All Users', users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).send('Error fetching users');
  }
});

// Admin: Delete a user
router.post('/delete-user/:id', async (req, res) => {
  try {
    const allowedAdmins = ['ybouziane144@gmail.com'];
    if (!req.session.user || !allowedAdmins.includes(req.session.user.email)) {
      return res.status(403).send('Access denied');
    }

    await User.findByIdAndDelete(req.params.id); 
    res.redirect('/users');
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).send('Error deleting user');
  }
});

// Verify email route
router.get('/verify-email', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.query.token });

    if (!user) {
      return res.send('Invalid or expired verification link.');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // ✅ Automatically log in the user
    req.session.user = { id: user._id, email: user.email };

  
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send('Something went wrong.');
  }
});

module.exports = router;
