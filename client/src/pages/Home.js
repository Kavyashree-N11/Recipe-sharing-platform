import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
    const [recipes, setRecipes] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    
    // Get the ID from local storage
    const userId = localStorage.getItem('userId'); 

    const fetchRecipes = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/recipes?search=${search}&category=${category}`);
            setRecipes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, [search, category]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/recipes/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setRecipes(recipes.filter(recipe => recipe._id !== id));
        } catch (err) {
            alert("Failed to delete (You might not be the owner)");
        }
    };

    return (
        <div className="home">
            <div className="filters">
                <input 
                    type="text" 
                    placeholder="Search recipes..." 
                    onChange={(e) => setSearch(e.target.value)} 
                />
                <select onChange={(e) => setCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Dessert">Dessert</option>
                </select>
            </div>

            <div className="recipe-grid">
                {recipes.map((recipe) => {
                    // DEBUGGING: This prints to your browser console (F12)
                    // Check if these two values match!
                    const isOwner = userId === String(recipe.userOwner);
                    console.log(`Recipe: ${recipe.title} | My ID: ${userId} | Owner ID: ${recipe.userOwner} | Match? ${isOwner}`);

                    return (
                        <div key={recipe._id} className="recipe-card">
                            {recipe.imageUrl && <img src={`http://localhost:5000${recipe.imageUrl}`} alt={recipe.title} />}
                            <h3>{recipe.title}</h3>
                            <span className="category-tag">{recipe.category}</span>
                            <p>{recipe.instructions.substring(0, 100)}...</p>
                            
                            {/* Only show buttons if IDs match */}
                            {isOwner && (
                                <div className="actions">
                                    <Link to={`/edit-recipe/${recipe._id}`} style={{width: '100%'}}>
                                        <button className="edit-btn">Edit</button>
                                    </Link>
                                    <button className="delete-btn" onClick={() => handleDelete(recipe._id)}>Delete</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Home;