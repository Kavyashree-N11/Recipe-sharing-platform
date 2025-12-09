import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateRecipe = () => {
    const [recipe, setRecipe] = useState({ title: '', ingredients: '', instructions: '', category: 'Breakfast' });
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

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
            await axios.post('http://localhost:5000/api/recipes', formData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
            });
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Failed to create recipe');
        }
    };

    return (
        <div className="create-recipe">
            <h2>Create Recipe</h2>
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Title" onChange={handleChange} required />
                <textarea name="ingredients" placeholder="Ingredients" onChange={handleChange} required />
                <textarea name="instructions" placeholder="Instructions" onChange={handleChange} required />
                <select name="category" onChange={handleChange}>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Dessert">Dessert</option>
                </select>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Submit Recipe</button>
            </form>
        </div>
    );
};

export default CreateRecipe;