const mongoose = require('mongoose');

const ImageMetaSchema = new mongoose.Schema({
  url: String,
  thumb: String,
  query: String,
  timestamp: { type: Date, default: Date.now },
  description: String,
  unsplashId: String,
}, { _id: false });

const UserSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, unique: true, sparse: true },
  githubId: { type: String, unique: true, sparse: true },
  displayName: { type: String, required: true },
  photo: { type: String },
  downloads: [ImageMetaSchema],
  favourites: [ImageMetaSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
