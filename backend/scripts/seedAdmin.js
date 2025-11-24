#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/leadsdb';
const email = process.env.SEED_ADMIN_EMAIL || process.argv[2];
const password = process.env.SEED_ADMIN_PASS || process.argv[3];
const name = process.env.SEED_ADMIN_NAME || process.argv[4] || 'Admin';

if (!email || !password) {
  console.error('Usage: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASS env vars, or run: node scripts/seedAdmin.js <email> <password> [name]');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  businessId: mongoose.Types.ObjectId,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  const exists = await User.findOne({ email }).exec();
  if (exists) {
    console.log('User already exists:', email);
    await mongoose.disconnect();
    return process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = await User.create({ name, email, password: hashed, role: 'admin' });
  console.log('Created admin:', { id: admin._id.toString(), email: admin.email });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to seed admin:', err.message || err);
  process.exit(1);
});
