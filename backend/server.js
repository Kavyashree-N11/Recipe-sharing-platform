require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Removed 'fs' and 'path' because Vercel doesn't allow file creation

const User = require('./models/User');
const Recipe = require('./models/Recipe');

const app = express();

app.use(express.json());

// CORS Config
app.use(cors({
    origin: ["http://localhost:3000", "https://your-frontend-app.vercel.app"], // Add your Vercel Frontend URL here later
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// --- CLOUDINARY CONFIG ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- MULTER STORAGE (Cloudinary) ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'recipes', 
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

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

// --- ROUTES ---

// 1. Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
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

// 3. Create Recipe (Using Cloudinary)
app.post('/api/recipes', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, ingredients, instructions, category, time } = req.body;
    
    // Cloudinary gives us the URL in req.file.path
    const imageUrl = req.file ? req.file.path : '';

    const recipe = new Recipe({
      title,
      ingredients,
      instructions,
      category,
      time,
      imageUrl, 
      createdBy: req.user._id
    });
    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};
    if (search) query.title = { $regex: search, $options: 'i' };
    if (category && category !== 'All') query.category = category;

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
    if (!recipe) return res.status(404).json({ message: "Not found" });
    if (recipe.createdBy.toString() !== req.user._id) return res.status(403).json({ message: 'Not authorized' });

    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Test Route
app.get('/', (req, res) => {
    res.send("API is running!");
});

// --- SERVER LISTENER ---

const PORT = process.env.PORT || 5000;

// This line allows Vercel to run the app as a Serverless Function
// It only listens on a port if running LOCALLY
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;

