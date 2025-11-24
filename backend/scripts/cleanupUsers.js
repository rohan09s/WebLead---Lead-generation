#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/leadsdb';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  const userSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

  console.log('Cleaning up user documents (unsetting business fields)...');

  const res = await User.updateMany(
    { $or: [ { category: { $exists: true } }, { location: { $exists: true } }, { description: { $exists: true } } ] },
    { $unset: { category: "", location: "", description: "" } }
  ).exec();

  console.log('Matched:', res.matchedCount || res.n, 'Modified:', res.modifiedCount || res.nModified);

  await mongoose.disconnect();
  console.log('Cleanup complete');
}

run().catch(err=>{ console.error(err); process.exit(1); });
