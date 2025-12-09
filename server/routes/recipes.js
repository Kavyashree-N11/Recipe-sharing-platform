const router = require('express').Router();
const Recipe = require('../models/Recipe');
const auth = require('../middleware/auth');
const multer = require('multer');

// Multer Config for Images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// 1. Get All Recipes (with Search & Filter)
router.get('/', async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = {};
        
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        if (category && category !== 'All') {
            query.category = category;
        }

        const recipes = await Recipe.find(query);
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create Recipe
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, ingredients, instructions, category } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
        
        const newRecipe = new Recipe({
            title, ingredients, instructions, category, imageUrl, userOwner: req.user
        });
        await newRecipe.save();
        res.json(newRecipe);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Update Recipe (PUT) - This was causing your issue
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ msg: "Recipe not found" });

        // Check ownership
        if (recipe.userOwner.toString() !== req.user) {
            return res.status(401).json({ msg: "Not authorized" });
        }

        // Update fields
        recipe.title = req.body.title || recipe.title;
        recipe.ingredients = req.body.ingredients || recipe.ingredients;
        recipe.instructions = req.body.instructions || recipe.instructions;
        recipe.category = req.body.category || recipe.category;

        // Update image only if a new file is uploaded
        if (req.file) {
            recipe.imageUrl = `/uploads/${req.file.filename}`;
        }

        await recipe.save();
        res.json(recipe);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Delete Recipe
router.delete('/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ msg: "Recipe not found" }); // Safety check

        if(recipe.userOwner.toString() !== req.user) {
            return res.status(401).json({ msg: "Not authorized" });
        }
        await recipe.deleteOne();
        res.json({ msg: "Recipe deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;