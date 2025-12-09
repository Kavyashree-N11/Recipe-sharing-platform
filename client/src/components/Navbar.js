import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/auth');
    };

    return (
        <nav className="navbar">
            <Link to="/" className="logo">RecipeShare</Link>
            <div className="nav-links">
                <Link to="/">Home</Link>
                {!token ? (
                    <Link to="/auth">Login/Register</Link>
                ) : (
                    <>
                        <Link to="/create-recipe">Create Recipe</Link>
                        <button onClick={logout}>Logout</button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;