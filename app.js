const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const voteRoutes = require('./routes/votes');
const authRoutes = require('./routes/auth');
require('dotenv').config(); 
const User = require('./models/user'); 

// App initialization
const app = express();

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts); // ← this
app.set('layout', 'layout');

// ✅ Connect to MongoDB (no deprecated options used)

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware (for login tracking)
app.use(session({
  secret: 'Stballondor', // Replace with environment variable in production
  resave: false,
  saveUninitialized: false
}));

// Expose session user to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user;
  next();
});

// Routes
app.use(authRoutes);
app.use('/', voteRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
