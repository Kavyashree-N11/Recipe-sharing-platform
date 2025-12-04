require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Recipe = require('./models/Recipe');

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());

// CORS Configuration for Vercel
// This allows your frontend to talk to this backend
app.use(cors({
    origin: ["http://localhost:3000", "https://your-frontend-app.vercel.app"], // Replace with your actual Vercel Frontend URL after you deploy it
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Serve uploaded images statically
// NOTE: On Vercel, these files are temporary and will be deleted. 
// Use Cloudinary for permanent storage in production.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directory exists (prevents crash on local)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// --- AUTH MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

// --- MULTER CONFIG (Image Upload) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- ROUTES ---

// 1. Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if(existingUser) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Recipe (with Image)
app.post('/api/recipes', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, ingredients, instructions, category, time } = req.body;
    
    // Construct absolute URL for image if it exists
    let imageUrl = '';
    if (req.file) {
        // On Localhost: http://localhost:5000/uploads/filename
        // On Vercel: https://your-backend.vercel.app/uploads/filename (Temporary)
        const protocol = req.protocol;
        const host = req.get('host');
        imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const recipe = new Recipe({
      title,
      ingredients,
      instructions,
      category,
      time,
      imageUrl: imageUrl, 
      createdBy: req.user._id
    });
    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get All Recipes (with Search & Filter)
app.get('/api/recipes', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    const recipes = await Recipe.find(query).populate('createdBy', 'username');
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete Recipe
app.delete('/api/recipes/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (recipe.createdBy.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Test Route (To check if backend is running on Vercel)
app.get('/', (req, res) => {
    res.send("Recipe Sharing Backend is Running!");
});

// --- SERVER LISTENER & EXPORT ---

const PORT = process.env.PORT || 5000;

// Only run app.listen if we are NOT in a Vercel environment (Local Development)
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export the app for Vercel
module.exports = app;

