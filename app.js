// app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the directory for static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use your session secret from .env
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware to make 'user' available in all templates
app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});

// Configure the Google OAuth 2.0 Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // From .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // From .env
      callbackURL: 'http://localhost:3000/auth/google/callback',
    },
    function (accessToken, refreshToken, profile, done) {
      // Here, you can check if the user is authorized
      const authorizedUsers = process.env.AUTHORIZED_USERS.split(',').map((email) => email.trim());
      const userEmail = profile.emails[0].value;

      if (authorizedUsers.includes(userEmail)) {
        // User is authorized
        return done(null, profile);
      } else {
        // User is not authorized
        return done(null, false, { message: 'Unauthorized user' });
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/privacy', (req, res) => {
  res.render('privacy');
});

app.get('/terms', (req, res) => {
  res.render('terms');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

// Google OAuth Routes
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/unauthorized' }),
  function (req, res) {
    // Successful authentication, redirect to dashboard.
    res.redirect('/dashboard');
  }
);

// Protected Route
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Unauthorized Route
app.get('/unauthorized', (req, res) => {
  res.status(403).render('unauthorized');
});

// Logout Route
app.get('/logout', function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
});

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Error handling middleware
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).render('error', { error: err });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
