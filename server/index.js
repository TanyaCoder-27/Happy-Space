require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
const User = require('./models/User');
const axios = require('axios');

// Search schema/model
const SearchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  term: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const Search = mongoose.model('Search', SearchSchema);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          displayName: profile.displayName,
          photo: profile.photos[0]?.value
        });
      }
      return done(null, user.id);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((userId, done) => {
  done(null, userId);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: '/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'photos', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ facebookId: profile.id });
    if (!user) {
      user = await User.create({
        facebookId: profile.id,
        displayName: profile.displayName,
        photo: profile.photos?.[0]?.value
      });
    }
    return done(null, user.id);
  } catch (err) {
    return done(err, null);
  }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: '/auth/github/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ githubId: profile.id });
    if (!user) {
      user = await User.create({
        githubId: profile.id,
        displayName: profile.displayName,
        photo: profile.photos?.[0]?.value
      });
    }
    return done(null, user.id);
  } catch (err) {
    return done(err, null);
  }
}));

// Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // You could redirect to the client or send info here
    res.redirect('http://localhost:3000/');
  }
);
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['public_profile'], authType: 'reauthenticate' }));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: 'http://localhost:3000/login' }),
  (req, res) => {
    res.redirect('http://localhost:3000/');
  }
);
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://localhost:3000/login' }),
  (req, res) => {
    res.redirect('http://localhost:3000/');
  }
);
app.get('/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.json({ status: 'logged out' });
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

app.post('/api/search', ensureAuthenticated, async (req, res) => {
  const { term, page = 1 } = req.body;
  if (!term) return res.status(400).json({ error: 'Missing term' });
  try {
    // Store search in DB
    await Search.create({
      userId: req.user._id,
      term,
    });
    // Unsplash API call (support paging)
    const unsplashRes = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: term, per_page: 16, page },
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    });
    res.json({
      term,
      total: unsplashRes.data.total,
      results: unsplashRes.data.results,
      page,
      totalPages: unsplashRes.data.total_pages
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/api/top-searches', async (req, res) => {
  try {
    // Aggregate to get the top 5 terms with their frequencies
    const top = await Search.aggregate([
      { $group: { _id: '$term', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    // Transform for frontend needs
    res.json(top.map(item => ({ term: item._id, count: item.count })));
  } catch (err) {
    console.error('Top searches error:', err);
    res.status(500).json({ error: 'Could not fetch top searches' });
  }
});

app.get('/api/history', ensureAuthenticated, async (req, res) => {
  try {
    const history = await Search.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .select('term timestamp -_id');
    res.json(history);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Could not fetch user history' });
  }
});

// Add/append images to user's downloads
app.post('/api/downloads', ensureAuthenticated, async (req, res) => {
  const { images } = req.body;
  if (!Array.isArray(images) || !images.length) return res.status(400).json({ error: 'No images provided' });
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { downloads: { $each: images.map(img => ({ ...img, timestamp: new Date() })) } } },
      { new: true }
    );
    res.json({ downloads: user.downloads });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save downloads' });
  }
});
// Get all user downloads
app.get('/api/downloads', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ downloads: user.downloads || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch downloads' });
  }
});
// Add or remove an image from favourites
app.post('/api/favourites', ensureAuthenticated, async (req, res) => {
  const { image, action } = req.body; // action: 'add' or 'remove'
  if (!image || !image.unsplashId) return res.status(400).json({ error: 'Invalid image' });
  try {
    let user;
    if (action === 'remove') {
      user = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { favourites: { unsplashId: image.unsplashId } } },
        { new: true }
      );
    } else {
      // add only if not exists
      user = await User.findOneAndUpdate(
        { _id: req.user._id, 'favourites.unsplashId': { $ne: image.unsplashId } },
        { $push: { favourites: { ...image, timestamp: new Date() } } },
        { new: true }
      );
      if (!user) user = await User.findById(req.user._id); // fallback, doesn't break
    }
    res.json({ favourites: user.favourites });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update favourites' });
  }
});
// Get all user favourites
app.get('/api/favourites', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ favourites: user.favourites || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favourites' });
  }
});

// Mongoose connection stub
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/udstudios', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Placeholder for later route setup

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});