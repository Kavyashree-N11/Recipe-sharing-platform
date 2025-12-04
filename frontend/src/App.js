import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// ==========================================
//             CONFIGURATION
// ==========================================
// This automatically picks the Vercel URL if deployed, or localhost if running locally
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// ==========================================
//             COMPONENTS
// ==========================================

// 1. Navbar Component
const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <h2>🍳 RecipeShare</h2>
      <div>
        <Link to="/">Home</Link>
        {isAuthenticated ? (
          <>
            <Link to="/create">Add Recipe</Link>
            <button 
              onClick={handleLogout} 
              style={{
                background:'transparent', 
                border:'none', 
                color:'white', 
                cursor:'pointer', 
                fontSize:'16px', 
                marginLeft:'15px', 
                fontWeight: 'bold'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

// 2. Auth Component (Login & Register)
const Auth = ({ type, setIsAuthenticated }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === 'register') {
        await axios.post(`${API_URL}/register`, formData);
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        const res = await axios.post(`${API_URL}/login`, { email: formData.email, password: formData.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        setIsAuthenticated(true);
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="container">
      <div className="card" style={{maxWidth: '400px', margin: 'auto', padding: '20px'}}>
        <h2>{type === 'login' ? 'Login' : 'Register'}</h2>
        <form onSubmit={handleSubmit}>
          {type === 'register' && (
            <div className="form-group">
              <label>Username</label>
              <input type="text" onChange={(e) => setFormData({...formData, username: e.target.value})} required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn" style={{width: '100%'}}>{type === 'login' ? 'Login' : 'Register'}</button>
        </form>
      </div>
    </div>
  );
};

// 3. Create Recipe Component
const CreateRecipe = () => {
  const [formData, setFormData] = useState({ title: '', ingredients: '', instructions: '', category: 'Breakfast', time: '' });
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (image) data.append('image', image);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/recipes`, data, {
        headers: { 'Authorization': token, 'Content-Type': 'multipart/form-data' }
      });
      alert('Recipe Posted Successfully!');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create recipe');
    }
  };

  return (
    <div className="container">
      <h2>Share a New Recipe</h2>
      <form onSubmit={handleSubmit} className="card" style={{padding: '20px'}}>
        <div className="form-group"><label>Title</label><input type="text" onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
        <div className="form-group"><label>Category</label>
          <select onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Dessert</option>
          </select>
        </div>
        <div className="form-group"><label>Ingredients</label><textarea rows="3" onChange={e => setFormData({...formData, ingredients: e.target.value})} required /></div>
        <div className="form-group"><label>Instructions</label><textarea rows="3" onChange={e => setFormData({...formData, instructions: e.target.value})} required /></div>
        <div className="form-group"><label>Time (mins)</label><input type="number" onChange={e => setFormData({...formData, time: e.target.value})} required /></div>
        <div className="form-group"><label>Image</label><input type="file" onChange={e => setImage(e.target.files[0])} /></div>
        <button type="submit" className="btn">Post Recipe</button>
      </form>
    </div>
  );
};

// 4. Edit Recipe Component
const EditRecipe = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', ingredients: '', instructions: '', category: '', time: '' });
  const [image, setImage] = useState(null);

  useEffect(() => {
    // Fetch existing data to populate the form
    axios.get(`${API_URL}/recipes`).then(res => {
        // Find the specific recipe from the list
        const recipe = res.data.find(r => r._id === id); 
        if(recipe) {
            setFormData({
                title: recipe.title,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                category: recipe.category,
                time: recipe.time
            });
        }
    }).catch(err => console.error(err));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (image) data.append('image', image);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/recipes/${id}`, data, {
        headers: { 'Authorization': token, 'Content-Type': 'multipart/form-data' }
      });
      alert('Recipe Updated!');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update. Are you the owner?');
    }
  };

  return (
    <div className="container">
      <h2>Edit Recipe</h2>
      <form onSubmit={handleSubmit} className="card" style={{padding: '20px'}}>
        <div className="form-group"><label>Title</label>
        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
        
        <div className="form-group"><label>Category</label>
          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Dessert</option>
          </select>
        </div>

        <div className="form-group"><label>Ingredients</label>
        <textarea rows="3" value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} /></div>
        
        <div className="form-group"><label>Instructions</label>
        <textarea rows="3" value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} /></div>
        
        <div className="form-group"><label>Time (mins)</label>
        <input type="number" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div>
        
        <div className="form-group"><label>New Image (Optional)</label>
        <input type="file" onChange={e => setImage(e.target.files[0])} /></div>
        
        <button type="submit" className="btn">Update Recipe</button>
      </form>
    </div>
  );
};

// 5. Home Component (Feed with Search/Filter)
const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const token = localStorage.getItem('token');
  const currentUsername = localStorage.getItem('username');

  const fetchRecipes = async () => {
    try {
      const res = await axios.get(`${API_URL}/recipes`, { params: { search, category } });
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchRecipes(); }, [search, category]);

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this recipe?")) return;
    try {
      await axios.delete(`${API_URL}/recipes/${id}`, { headers: { 'Authorization': token } });
      fetchRecipes(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Not authorized to delete this recipe');
    }
  };

  return (
    <div className="container">
      <div className="filters">
        <input 
          placeholder="Search by title..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{padding:'10px', width: '200px', border:'1px solid #ddd', borderRadius:'4px'}} 
        />
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)} 
          style={{padding:'10px', border:'1px solid #ddd', borderRadius:'4px'}}
        >
          <option>All</option><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Dessert</option>
        </select>
      </div>

      <div className="card-grid">
        {recipes.map(recipe => (
          <div key={recipe._id} className="card">
            {/* UPDATED: Removed localhost prefix because Cloudinary returns full URLs */}
            {recipe.imageUrl ? (
                <img src={recipe.imageUrl} alt={recipe.title} />
            ) : (
                <div style={{height:'200px', background:'#eee', display:'flex', alignItems:'center', justifyContent:'center'}}>No Image</div>
            )}
            
            <div className="card-body">
              <h3 style={{margin: '0 0 10px 0'}}>{recipe.title}</h3>
              <p style={{fontSize: '0.9rem', color: '#666'}}>
                <strong>Category:</strong> {recipe.category} &bull; <strong>Time:</strong> {recipe.time}m
              </p>
              <p style={{fontSize: '0.9rem'}}><strong>Chef:</strong> {recipe.createdBy?.username || 'Unknown'}</p>
              
              <details style={{marginTop: '10px', cursor:'pointer'}}>
                <summary>View Details</summary>
                <div style={{marginTop: '10px', fontSize:'0.9rem'}}>
                  <p><strong>Ingredients:</strong><br/> {recipe.ingredients}</p>
                  <p><strong>Steps:</strong><br/> {recipe.instructions}</p>
                </div>
              </details>

              {/* Show Edit/Delete buttons only if logged in */}
              {token && (
                <div style={{marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                   <Link 
                     to={`/edit/${recipe._id}`} 
                     className="btn" 
                     style={{backgroundColor: '#3498db', textDecoration:'none', marginRight: '10px', display:'inline-block'}}
                   >
                     Edit
                   </Link>
                   <button 
                     className="btn btn-delete" 
                     onClick={() => handleDelete(recipe._id)}
                   >
                     Delete
                   </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
//             MAIN APP
// ==========================================

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth type="login" setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Auth type="register" />} />
        <Route path="/create" element={isAuthenticated ? <CreateRecipe /> : <Navigate to="/login" />} />
        <Route path="/edit/:id" element={isAuthenticated ? <EditRecipe /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;