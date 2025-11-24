#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/leadsdb';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  const userSchema = new mongoose.Schema({}, { strict: false });
  const businessSchema = new mongoose.Schema({}, { strict: false });

  const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');
  const Business = mongoose.models.Business || mongoose.model('Business', businessSchema, 'businesses');

  // Find users that look like businesses but have no businessId
  const candidates = await User.find({ role: 'business', $or: [ { businessId: { $exists: false } }, { businessId: null } ] }).lean().exec();
  console.log('Found', candidates.length, 'business users without business records');

  for (const u of candidates) {
    try {
      const doc = {
        name: u.name || u.email || 'Unnamed Business',
        owner: u._id,
        category: u.category || '',
        location: u.location || '',
        description: u.description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const created = await Business.create(doc);
      await User.updateOne({ _id: u._id }, { $set: { businessId: created._id } }).exec();
      console.log('Created business for user', u.email, '->', created._id.toString());
    } catch (err) {
      console.error('Failed for user', u.email, err.message || err);
    }
  }

  await mongoose.disconnect();
  console.log('Migration complete');
}

run().catch(err=>{ console.error(err); process.exit(1) });
