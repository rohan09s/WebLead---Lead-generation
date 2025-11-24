import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists and serve static files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const name = `${Date.now()}-${Math.random().toString(36).substring(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// ---------------------
// MongoDB Connection
// ---------------------
const MONGO_URI = process.env.MONGO_URI || "";
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB Error:", err));
} else {
  console.log("⚠ No MongoDB URI provided. Using in-memory storage.");
}

// ---------------------
// Mailer setup (optional)
// Provide SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and NOTIFY_EMAIL in env
// ---------------------
let mailer = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  try {
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("Mailer configured");
  } catch (err) {
    console.error("Failed to configure mailer:", err.message);
    mailer = null;
  }
}

// ---------------------
// Models
// ---------------------
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ["admin", "business", "customer"], default: "business" },
  businessId: mongoose.Types.ObjectId,
  phone: String,
  address: String,
  bio: String,
});

const businessSchema = new mongoose.Schema({
  name: String,
  owner: mongoose.Types.ObjectId,
  category: String,
  location: String,
  description: String,
}, { timestamps: true });

const leadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  businessId: mongoose.Types.ObjectId,
  timestamp: Date,
  submittedBy: mongoose.Types.ObjectId,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Business = mongoose.models.Business || mongoose.model("Business", businessSchema);
const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

const productSchema = new mongoose.Schema({
  name: String,
  sku: String,
  price: Number,
  quantity: { type: Number, default: 0 },
  description: String,
  images: [String],
  businessId: mongoose.Types.ObjectId,
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// ---------------------
// JWT Middleware
// ---------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET || "secret123", (err, user) => {
    if (err) return res.status(403).json({ error: "Token expired or invalid" });
    req.user = user;
    next();
  });
}

// ---------------------
// AUTH ROUTES
// ---------------------

// Register (Business)
app.post("/api/auth/register", async (req, res) => {
  try {
    // Pull expected fields, and sanitize the request body to ensure business-only
    // fields don't get persisted to the `users` collection.
    const { name, email, password } = req.body;
    // Remove any business fields from req.body so they can't be stored on User
    // by mistake. We also keep an explicit $unset later as an extra safety net.
    delete req.body.category;
    delete req.body.location;
    delete req.body.description;
    // allow optional role, but never allow creating admin via public register
    let role = req.body.role || 'business';
    if (role !== 'business' && role !== 'customer') role = 'business';
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashed, role });

    // If registering as a business, create a Business entry and link it
    if (role === 'business') {
      const biz = await Business.create({
        name: name || email,
        owner: user._id,
        category: req.body.category || "",
        location: req.body.location || "",
        description: req.body.description || "",
      });

      user.businessId = biz._id;
      await user.save();

      return res.json({ message: "Business registered", businessId: biz._id });
    }

    // Ensure we do not accidentally persist business fields on the user document.
    // This unsets any legacy or unexpected business fields that may have been
    // sent in the request or left over from earlier migrations.
    try {
      await User.updateOne({ _id: user._id }, { $unset: { category: "", location: "", description: "" } }).exec();
    } catch (e) {
      console.error('Failed to cleanup user business fields:', e && e.message);
    }

    res.json({ message: "User registered", userId: user._id });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, businessId: user.businessId },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { name: user.name, email: user.email, role: user.role, businessId: user.businessId, phone: user.phone, address: user.address, bio: user.bio },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Update current user's profile (protected)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const allowed = ['name','phone','address','bio'];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).lean().exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: { name: user.name, email: user.email, role: user.role, businessId: user.businessId, phone: user.phone, address: user.address, bio: user.bio } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// One-off: seed/create an admin user using a secret key (do NOT enable publicly)
// Usage: POST /api/admin/seed { key, name, email, password }
// Require env var SEED_ADMIN_KEY to be set and match the request body key.
app.post('/api/admin/seed', async (req, res) => {
  try {
    const seedKey = process.env.SEED_ADMIN_KEY;
    if (!seedKey) return res.status(403).json({ error: 'Seeding disabled' });

    const { key, name, email, password } = req.body;
    if (!key || key !== seedKey) return res.status(403).json({ error: 'Invalid seed key' });
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({ name: name || 'Admin', email, password: hashed, role: 'admin' });

    // Return a JWT so you can use it immediately
    const token = jwt.sign({ id: admin._id, role: admin.role, email: admin.email }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

    res.json({ message: 'Admin created', token, user: { name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------
// LEADS ROUTES
// ---------------------

// Send inquiry (protected - only logged-in users)
app.post("/api/leads", authenticateToken, async (req, res) => {
  try {
    const { name, phone, message, businessId } = req.body;

    // Require phone and email (email comes from token when available)
    const email = req.user?.email || req.body.email;
    if (!phone || !email) {
      return res.status(400).json({ error: "phone and email are required" });
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      message,
      businessId,
      timestamp: new Date(),
      submittedBy: req.user?.id,
    });

    // Send notification email if mailer and NOTIFY_EMAIL configured
    try {
      const notifyTo = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
      const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
      if (mailer && notifyTo) {
        const subject = `New lead for business ${String(businessId || "")}`;
        const text = `A new lead was submitted:\n\nName: ${lead.name || "-"}\nEmail: ${lead.email || "-"}\nPhone: ${lead.phone || "-"}\nMessage: ${lead.message || "-"}\nBusiness ID: ${lead.businessId || "-"}\nTime: ${lead.timestamp}\nSubmittedBy: ${lead.submittedBy || "-"}`;

        mailer.sendMail({ from, to: notifyTo, subject, text }).catch((err) => {
          console.error("Failed to send lead notification:", err.message);
        });
      }
    } catch (err) {
      console.error("Mailer error:", err.message);
    }

    res.json({ message: "Lead sent", lead });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get leads (protected)
app.get("/api/leads", authenticateToken, async (req, res) => {
  try {
    // Admin sees all leads
    if (req.user.role === "admin") {
      const allLeads = await Lead.find().sort({ timestamp: -1 }).lean().exec();
      // Attach businessName where possible to help admin UI
      const withNames = await Promise.all(
        allLeads.map(async (ld) => {
          if (!ld.businessId) return ld;
          try {
            const biz = await Business.findById(ld.businessId).select('name').lean().exec();
            if (biz) ld.businessName = biz.name;
          } catch (e) {
            // ignore
          }
          return ld;
        })
      );
      return res.json(withNames);
    }

    // Business users see leads for their businessId
    if (req.user.role === 'business') {
      const businessId = req.user.businessId;
      if (!businessId) return res.json([]);
      const leads = await Lead.find({ businessId }).sort({ timestamp: -1 });
      return res.json(leads);
    }

    // Customers see the leads they submitted (submittedBy)
    const leads = await Lead.find({ submittedBy: req.user.id }).sort({ timestamp: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Public businesses endpoints
app.get('/api/businesses', async (req, res) => {
  try {
    const docs = await Business.find().select('name category location description').sort({ createdAt: -1 }).lean().exec();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/businesses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Business.findById(id).select('name category location description').lean().exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Public: list products for a given business id
app.get('/api/businesses/:id/products', async (req, res) => {
  try {
    const id = req.params.id;
    const docs = await Product.find({ businessId: id }).select('name sku price quantity description images').sort({ createdAt: -1 }).lean().exec();
    res.json(docs);
  } catch (err) {
    console.error('Listing products for business failed', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------
// PRODUCTS (for businesses)
// ---------------------

// Create product (business owners) or admin
app.post('/api/business/products', authenticateToken, async (req, res) => {
  try {
    const { name, sku, price, quantity, description, images, businessId } = req.body;
    // server-side validation
    const errors = {};
    if (!name || String(name).trim() === '') errors.name = 'Name is required';
    const numPrice = Number(price || 0);
    if (isNaN(numPrice) || numPrice < 0) errors.price = 'Price must be a non-negative number';
    const numQty = Number(quantity || 0);
    if (!Number.isInteger(numQty) || numQty < 0) errors.quantity = 'Quantity must be a non-negative integer';
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed', details: errors });
    // business users: associate with their businessId
    let bid = businessId;
    if (req.user.role === 'business') {
      bid = req.user.businessId;
    }
    if (!bid) return res.status(400).json({ error: 'businessId required' });

    // Only allow business owners or admin to create
    if (req.user.role === 'business' || req.user.role === 'admin') {
      const p = await Product.create({ name, sku, price: numPrice, quantity: numQty, description, images: images || [], businessId: bid });
      return res.json({ product: p });
    }

    res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List products for current business (or all for admin)
app.get('/api/business/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const docs = await Product.find().sort({ createdAt: -1 }).lean().exec();
      return res.json(docs);
    }
    if (req.user.role === 'business') {
      const bid = req.user.businessId;
      if (!bid) return res.json([]);
      const docs = await Product.find({ businessId: bid }).sort({ createdAt: -1 }).lean().exec();
      return res.json(docs);
    }
    // customers not allowed
    res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product (ensure access)
app.get('/api/business/products/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const p = await Product.findById(id).lean().exec();
    if (!p) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'admin') return res.json(p);
    if (req.user.role === 'business' && String(p.businessId) === String(req.user.businessId)) return res.json(p);
    res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product
app.put('/api/business/products/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const p = await Product.findById(id).exec();
    if (!p) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && String(p.businessId) !== String(req.user.businessId)) return res.status(403).json({ error: 'Forbidden' });
    // server-side validation
    const { name, sku, price, quantity, description, images } = req.body;
    const errors = {};
    if (!name || String(name).trim() === '') errors.name = 'Name is required';
    const numPrice = Number(price || 0);
    if (isNaN(numPrice) || numPrice < 0) errors.price = 'Price must be a non-negative number';
    const numQty = Number(quantity || 0);
    if (!Number.isInteger(numQty) || numQty < 0) errors.quantity = 'Quantity must be a non-negative integer';
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed', details: errors });

    const updates = { name, sku, price: numPrice, quantity: numQty, description, images };
    Object.assign(p, updates);
    await p.save();
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product
app.delete('/api/business/products/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const p = await Product.findById(id).exec();
    if (!p) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && String(p.businessId) !== String(req.user.businessId)) return res.status(403).json({ error: 'Forbidden' });
    await Product.findByIdAndDelete(id).exec();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload images (multipart) - businesses/admins
app.post('/api/business/products/upload', authenticateToken, upload.array('images', 8), async (req, res) => {
  try {
    if (!(req.user.role === 'business' || req.user.role === 'admin')) return res.status(403).json({ error: 'Forbidden' });
    const files = req.files || [];
    const urls = files.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`);
    res.json({ urls });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Admin: manage businesses
app.get('/api/admin/businesses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const docs = await Business.find().sort({ createdAt: -1 }).lean().exec();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list users with role 'business' who don't have a linked Business record
app.get('/api/admin/users-without-business', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const users = await User.find({
      role: 'business',
      $or: [ { businessId: { $exists: false } }, { businessId: null } ]
    }).select('_id name email createdAt').sort({ createdAt: -1 }).lean().exec();

    res.json(users);
  } catch (err) {
    console.error('users-without-business error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.put('/api/admin/businesses/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const id = req.params.id;
    const updates = (({ name, category, location, description }) => ({ name, category, location, description }))(req.body);
    const doc = await Business.findByIdAndUpdate(id, updates, { new: true }).lean().exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/businesses/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const id = req.params.id;
    const doc = await Business.findByIdAndDelete(id).lean().exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    // Unlink from user if exists
    await User.updateOne({ businessId: id }, { $unset: { businessId: '' } }).exec();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------
// Start server
// ---------------------
app.listen(4000, () => console.log("Server running on port 4000"));