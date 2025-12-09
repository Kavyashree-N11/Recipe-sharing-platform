import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditRecipe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState({ title: '', ingredients: '', instructions: '', category: 'Breakfast' });
    const [file, setFile] = useState(null);

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/recipes`);
                // Filter locally since we don't have a get-single-recipe route in this simple version
                // Ideally, you'd create a router.get('/:id') backend route
                const found = res.data.find(r => r._id === id); 
                if (found) setRecipe(found);
            } catch (err) {
                console.error(err);
            }
        };
        fetchRecipe();
    }, [id]);

    const handleChange = (e) => {
        setRecipe({ ...recipe, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', recipe.title);
        formData.append('ingredients', recipe.ingredients);
        formData.append('instructions', recipe.instructions);
        formData.append('category', recipe.category);
        if (file) formData.append('image', file);

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/recipes/${id}`, formData, {
                headers: { 'x-auth-token': token }
            });
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Failed to update recipe');
        }
    };

    return (
        <div className="create-recipe">
            <h2>Edit Recipe</h2>
            <form onSubmit={handleSubmit}>
                <input name="title" value={recipe.title} onChange={handleChange} required />
                <textarea name="ingredients" value={recipe.ingredients} onChange={handleChange} required />
                <textarea name="instructions" value={recipe.instructions} onChange={handleChange} required />
                <select name="category" value={recipe.category} onChange={handleChange}>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Dessert">Dessert</option>
                </select>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Update Recipe</button>
            </form>
        </div>
    );
};

export default EditRecipe;