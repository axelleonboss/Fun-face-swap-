const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection with YOUR credentials
const uri = "mongodb+srv://axelleonboss_db_bensupplier:917M8WUXSHmDqnyd@bensuppliercluster.fujivug.mongodb.net/ben-supplier?retryWrites=true&w=majority&appName=BensupplierCluster";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db('ben-supplier');
    console.log("✅ Successfully connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  }
}

connectDB();

// File upload setup
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// API Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.collection('products').find().sort({ createdAt: -1 }).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.collection('products').findOne({ _id: req.params.id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/products', upload.array('images', 4), async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    
    const product = {
      _id: Date.now().toString(),
      name,
      price: parseInt(price),
      description,
      category,
      images: req.files ? req.files.map(file => file.filename) : [],
      createdAt: new Date()
    };

    await db.collection('products').insertOne(product);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await db.collection('products').deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Serve Admin Panel
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Ben Supplier</title>
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #1a1a1a;
            --accent-color: #2563eb;
            --secondary-color: #6b7280;
            --card-bg: #f8fafc;
            --border-color: #e2e8f0;
            --success-color: #10b981;
            --error-color: #ef4444;
        }

        [data-theme="dark"] {
            --bg-color: #0f172a;
            --text-color: #f1f5f9;
            --accent-color: #3b82f6;
            --secondary-color: #94a3b8;
            --card-bg: #1e293b;
            --border-color: #334155;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            transition: background-color 0.3s, color 0.3s;
        }

        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
        }

        .admin-container {
            display: flex;
            min-height: 100vh;
        }

        /* Sidebar */
        .sidebar {
            width: 250px;
            background-color: var(--card-bg);
            border-right: 1px solid var(--border-color);
            padding: 2rem 1rem;
        }

        .sidebar h2 {
            color: var(--accent-color);
            margin-bottom: 2rem;
            text-align: center;
        }

        .sidebar nav ul {
            list-style: none;
        }

        .sidebar nav li {
            margin-bottom: 0.5rem;
        }

        .sidebar nav a {
            display: block;
            padding: 0.75rem 1rem;
            text-decoration: none;
            color: var(--text-color);
            border-radius: 5px;
            transition: background-color 0.3s;
        }

        .sidebar nav a:hover,
        .sidebar nav a.active {
            background-color: var(--accent-color);
            color: white;
        }

        /* Main Content */
        .main-content {
            flex: 1;
            padding: 2rem;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        .header h1 {
            color: var(--accent-color);
        }

        /* Forms */
        .form-container {
            background-color: var(--card-bg);
            border-radius: 10px;
            padding: 2rem;
            border: 1px solid var(--border-color);
            max-width: 800px;
            margin: 0 auto;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 5px;
            background-color: var(--bg-color);
            color: var(--text-color);
            font-size: 1rem;
        }

        .form-group textarea {
            height: 120px;
            resize: vertical;
        }

        .image-upload-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .image-upload-box {
            border: 2px dashed var(--border-color);
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: border-color 0.3s;
            height: 150px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .image-upload-box:hover {
            border-color: var(--accent-color);
        }

        .image-upload-box img {
            max-width: 100%;
            max-height: 100px;
            margin-bottom: 0.5rem;
        }

        .image-preview {
            position: relative;
            display: inline-block;
        }

        .remove-image {
            position: absolute;
            top: -8px;
            right: -8px;
            background: var(--error-color);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 12px;
        }

        .btn {
            background-color: var(--accent-color);
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
        }

        .btn:hover {
            opacity: 0.9;
        }

        .btn-success {
            background-color: var(--success-color);
        }

        .btn-danger {
            background-color: var(--error-color);
        }

        /* Products Table */
        .products-table {
            width: 100%;
            border-collapse: collapse;
            background-color: var(--card-bg);
            border-radius: 8px;
            overflow: hidden;
        }

        .products-table th,
        .products-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        .products-table th {
            background-color: var(--accent-color);
            color: white;
            font-weight: 500;
        }

        .product-image-cell img {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
        }

        .action-buttons {
            display: flex;
            gap: 0.5rem;
        }

        .action-btn {
            padding: 0.25rem 0.5rem;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.8rem;
        }

        .edit-btn {
            background-color: var(--accent-color);
            color: white;
        }

        .delete-btn {
            background-color: var(--error-color);
            color: white;
        }

        /* Messages */
        .message {
            padding: 1rem;
            border-radius: 5px;
            margin-bottom: 1rem;
            text-align: center;
        }

        .success {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }

        .error {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }

        /* Login Page */
        .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, var(--accent-color) 0%, #1e40af 100%);
        }

        .login-box {
            background-color: var(--bg-color);
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }

        .login-box h2 {
            text-align: center;
            margin-bottom: 2rem;
            color: var(--accent-color);
        }
    </style>
</head>
<body>
    <!-- Login Screen (Initially shown) -->
    <div id="loginScreen" class="login-container">
        <div class="login-box">
            <h2>Admin Login</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn" style="width: 100%;">Login</button>
            </form>
            <div id="loginMessage" style="margin-top: 1rem;"></div>
        </div>
    </div>

    <!-- Admin Panel (Initially hidden) -->
    <div id="adminPanel" class="admin-container" style="display: none;">
        <!-- Sidebar -->
        <div class="sidebar">
            <h2>Ben Supplier</h2>
            <nav>
                <ul>
                    <li><a href="#" class="active" data-section="dashboard">Dashboard</a></li>
                    <li><a href="#" data-section="add-product">Add Product</a></li>
                    <li><a href="#" data-section="manage-products">Manage Products</a></li>
                    <li><a href="#" id="logoutBtn">Logout</a></li>
                </ul>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Dashboard Section -->
            <section id="dashboard" class="content-section">
                <div class="header">
                    <h1>Dashboard</h1>
                    <div>Welcome, Admin!</div>
                </div>
                <div class="form-container">
                    <h3>Store Overview</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem;">
                        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 1.5rem; border-radius: 8px; text-align: center;">
                            <h3 id="totalProducts">0</h3>
                            <p>Total Products</p>
                        </div>
                        <div style="background: linear-gradient(135deg, #10b981, #047857); color: white; padding: 1.5rem; border-radius: 8px; text-align: center;">
                            <h3>₦0</h3>
                            <p>Total Value</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Add Product Section -->
            <section id="add-product" class="content-section" style="display: none;">
                <div class="header">
                    <h1>Add New Product</h1>
                </div>
                <div class="form-container">
                    <form id="productForm">
                        <div class="form-group">
                            <label for="productName">Product Name</label>
                            <input type="text" id="productName" name="productName" required>
                        </div>

                        <div class="form-group">
                            <label for="productPrice">Price (₦)</label>
                            <input type="number" id="productPrice" name="productPrice" required min="0">
                        </div>

                        <div class="form-group">
                            <label for="productDescription">Description</label>
                            <textarea id="productDescription" name="productDescription" required></textarea>
                        </div>

                        <div class="form-group">
                            <label for="productCategory">Category</label>
                            <select id="productCategory" name="productCategory" required>
                                <option value="">Select Category</option>
                                <option value="Travel Comfort">Travel Comfort</option>
                                <option value="Home Essentials">Home Essentials</option>
                                <option value="Tech Accessories">Tech Accessories</option>
                                <option value="Budget Finds">Budget Finds</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Product Images (Up to 4 images)</label>
                            <div class="image-upload-container">
                                <div class="image-upload-box" data-index="0">
                                    <input type="file" accept="image/*" style="display: none;" data-index="0">
                                    <div>Click to upload image 1</div>
                                </div>
                                <div class="image-upload-box" data-index="1">
                                    <input type="file" accept="image/*" style="display: none;" data-index="1">
                                    <div>Click to upload image 2</div>
                                </div>
                                <div class="image-upload-box" data-index="2">
                                    <input type="file" accept="image/*" style="display: none;" data-index="2">
                                    <div>Click to upload image 3</div>
                                </div>
                                <div class="image-upload-box" data-index="3">
                                    <input type="file" accept="image/*" style="display: none;" data-index="3">
                                    <div>Click to upload image 4</div>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-success">Add Product</button>
                    </form>
                    <div id="formMessage" style="margin-top: 1rem;"></div>
                </div>
            </section>

            <!-- Manage Products Section -->
            <section id="manage-products" class="content-section" style="display: none;">
                <div class="header">
                    <h1>Manage Products</h1>
                </div>
                <div class="form-container">
                    <table class="products-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Category</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="productsTableBody">
                            <!-- Products will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>

    <script>
        // Admin credentials
        const ADMIN_CREDENTIALS = {
            username: "admin",
            password: "bensupplier123"
        };

        // DOM Elements
        const loginScreen = document.getElementById('loginScreen');
        const adminPanel = document.getElementById('adminPanel');
        const loginForm = document.getElementById('loginForm');
        const loginMessage = document.getElementById('loginMessage');
        const logoutBtn = document.getElementById('logoutBtn');
        const contentSections = document.querySelectorAll('.content-section');
        const navLinks = document.querySelectorAll('.sidebar nav a');
        const productForm = document.getElementById('productForm');
        const formMessage = document.getElementById('formMessage');
        const productsTableBody = document.getElementById('productsTableBody');
        const totalProductsElement = document.getElementById('totalProducts');

        // Image upload handling
        const imageUploadBoxes = document.querySelectorAll('.image-upload-box');
        let productImages = [null, null, null, null];

        // Login functionality
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                loginScreen.style.display = 'none';
                adminPanel.style.display = 'flex';
                showSection('dashboard');
                loadProducts();
            } else {
                showMessage(loginMessage, 'Invalid username or password', 'error');
            }
        });

        // Logout functionality
        logoutBtn.addEventListener('click', function() {
            adminPanel.style.display = 'none';
            loginScreen.style.display = 'flex';
            loginForm.reset();
            loginMessage.innerHTML = '';
            localStorage.removeItem('adminLoggedIn');
        });

        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (this.id !== 'logoutBtn') {
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    const section = this.getAttribute('data-section');
                    showSection(section);
                }
            });
        });

        function showSection(sectionId) {
            contentSections.forEach(section => {
                section.style.display = section.id === sectionId ? 'block' : 'none';
            });
            
            if (sectionId === 'manage-products') {
                loadProducts();
            } else if (sectionId === 'dashboard') {
                updateDashboard();
            }
        }

        // Image upload functionality
        imageUploadBoxes.forEach((box, index) => {
            const fileInput = box.querySelector('input[type="file"]');
            
            box.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            productImages[index] = file;
                            box.innerHTML = \`
                                <div class="image-preview">
                                    <img src="\${e.target.result}" alt="Preview">
                                    <button type="button" class="remove-image" data-index="\${index}">×</button>
                                </div>
                            \`;
                            
                            box.querySelector('.remove-image').addEventListener('click', (e) => {
                                e.stopPropagation();
                                removeImage(index);
                            });
                        };
                        reader.readAsDataURL(file);
                    } else {
                        showMessage(formMessage, 'Please select a valid image file', 'error');
                    }
                }
            });
        });

        function removeImage(index) {
            productImages[index] = null;
            const box = document.querySelector(\`.image-upload-box[data-index="\${index}"]\`);
            box.innerHTML = \`
                <input type="file" accept="image/*" style="display: none;" data-index="\${index}">
                <div>Click to upload image \${index + 1}</div>
            \`;
            
            const fileInput = box.querySelector('input[type="file"]');
            box.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', handleImageUpload);
        }

        function handleImageUpload(e) {
            const index = parseInt(e.target.getAttribute('data-index'));
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    productImages[index] = file;
                    const box = document.querySelector(\`.image-upload-box[data-index="\${index}"]\`);
                    box.innerHTML = \`
                        <div class="image-preview">
                            <img src="\${e.target.result}" alt="Preview">
                            <button type="button" class="remove-image" data-index="\${index}">×</button>
                        </div>
                    \`;
                    
                    box.querySelector('.remove-image').addEventListener('click', (e) => {
                        e.stopPropagation();
                        removeImage(index);
                    });
                };
                reader.readAsDataURL(file);
            }
        }

        // Product form submission
        productForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const productName = document.getElementById('productName').value;
            const productPrice = document.getElementById('productPrice').value;
            const productDescription = document.getElementById('productDescription').value;
            const productCategory = document.getElementById('productCategory').value;
            
            const uploadedImages = productImages.filter(img => img !== null);
            if (uploadedImages.length === 0) {
                showMessage(formMessage, 'Please upload at least one product image', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('name', productName);
            formData.append('price', productPrice);
            formData.append('description', productDescription);
            formData.append('category', productCategory);
            
            productImages.forEach((img, index) => {
                if (img) {
                    formData.append('images', img);
                }
            });
            
            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showMessage(formMessage, 'Product added successfully!', 'success');
                    productForm.reset();
                    productImages = [null, null, null, null];
                    imageUploadBoxes.forEach((box, index) => {
                        box.innerHTML = \`
                            <input type="file" accept="image/*" style="display: none;" data-index="\${index}">
                            <div>Click to upload image \${index + 1}</div>
                        \`;
                        const fileInput = box.querySelector('input[type="file"]');
                        box.addEventListener('click', () => fileInput.click());
                        fileInput.addEventListener('change', handleImageUpload);
                    });
                    
                    loadProducts();
                    updateDashboard();
                } else {
                    showMessage(formMessage, result.error || 'Error adding product', 'error');
                }
            } catch (error) {
                showMessage(formMessage, 'Network error. Please try again.', 'error');
                console.error('Error:', error);
            }
        });

        // Load products for management
        async function loadProducts() {
            try {
                const response = await fetch('/api/products');
                const products = await response.json();
                
                productsTableBody.innerHTML = '';
                
                if (products.length === 0) {
                    productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No products found</td></tr>';
                } else {
                    products.forEach(product => {
                        const row = document.createElement('tr');
                        row.innerHTML = \`
                            <td class="product-image-cell">
                                \${product.images && product.images.length > 0 ? 
                                    \`<img src="/uploads/\${product.images[0]}" alt="\${product.name}">\` : 
                                    'No Image'}
                            </td>
                            <td>\${product.name}</td>
                            <td>₦\${parseInt(product.price).toLocaleString()}</td>
                            <td>\${product.category}</td>
                            <td class="action-buttons">
                                <button class="action-btn delete-btn" data-id="\${product._id}">Delete</button>
                            </td>
                        \`;
                        productsTableBody.appendChild(row);
                    });
                    
                    document.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const productId = this.getAttribute('data-id');
                            deleteProduct(productId);
                        });
                    });
                }
                
                updateDashboard();
            } catch (error) {
                console.error('Error loading products:', error);
                productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Error loading products</td></tr>';
            }
        }

        // Delete product
        async function deleteProduct(productId) {
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    const response = await fetch(\`/api/products/\${productId}\`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        loadProducts();
                        updateDashboard();
                    } else {
                        alert('Error deleting product');
                    }
                } catch (error) {
                    console.error('Error deleting product:', error);
                    alert('Network error. Please try again.');
                }
            }
        }

        // Update dashboard stats
        async function updateDashboard() {
            try {
                const response = await fetch('/api/products');
                const products = await response.json();
                
                totalProductsElement.textContent = products.length;
            } catch (error) {
                console.error('Error updating dashboard:', error);
            }
        }

        // Utility function to show messages
        function showMessage(element, message, type) {
            element.innerHTML = \`<div class="message \${type}">\${message}</div>\`;
            setTimeout(() => {
                element.innerHTML = '';
            }, 5000);
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            const isLoggedIn = localStorage.getItem('adminLoggedIn');
            if (isLoggedIn) {
                loginScreen.style.display = 'none';
                adminPanel.style.display = 'flex';
                showSection('dashboard');
                loadProducts();
            }
            
            loginForm.addEventListener('submit', function() {
                localStorage.setItem('adminLoggedIn', 'true');
            });
        });
    </script>
</body>
</html>
  `);
});

// Serve Homepage
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ben Supplier - Quality Essentials</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: white; color: #1a1a1a; }
        
        header { 
            background: white; 
            padding: 1rem 5%; 
            border-bottom: 1px solid #e2e8f0; 
            position: sticky; 
            top: 0; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo { 
            font-size: 1.5rem; 
            font-weight: bold; 
            color: #2563eb; 
        }
        
        .hero {
            padding: 4rem 5%;
            text-align: center;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
        }
        
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 5%;
        }
        
        .product-card {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            border: 1px solid #e2e8f0;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .product-image {
            width: 100%;
            height: 200px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            overflow: hidden;
        }
        
        .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .product-price {
            color: #2563eb;
            font-weight: bold;
            font-size: 1.2rem;
            margin: 0.5rem 0;
        }
        
        .btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            margin: 0.25rem;
        }
        
        .admin-link {
            color: #2563eb;
            text-decoration: none;
            font-weight: bold;
            padding: 0.5rem 1rem;
            border: 2px solid #2563eb;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <header>
        <div class="logo">BenSupplier</div>
        <nav>
            <a href="/admin" class="admin-link">Admin Panel</a>
        </nav>
    </header>

    <section class="hero">
        <h1>Quality Essentials for Everyday Life</h1>
        <p>Your trusted supplier for affordable items</p>
    </section>

    <div class="product-grid" id="productsContainer">
        <div>Loading products...</div>
    </div>

    <script>
        async function loadProducts() {
            try {
                const response = await fetch('/api/products');
                const products = await response.json();
                
                const container = document.getElementById('productsContainer');
                container.innerHTML = '';
                
                if (products.length === 0) {
                    container.innerHTML = '<div style="text-align: center; padding: 2rem; grid-column: 1 / -1;">No products available yet. Check back soon!</div>';
                    return;
                }
                
                products.forEach(product => {
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.innerHTML = \`
                        <div class="product-image">
                            \${product.images && product.images.length > 0 ? 
                                \`<img src="/uploads/\${product.images[0]}" alt="\${product.name}">\` : 
                                'No Image'}
                        </div>
                        <h3>\${product.name}</h3>
                        <p>\${product.description}</p>
                        <div class="product-price">₦\${product.price.toLocaleString()}</div>
                        <button class="btn">Add to Cart</button>
                    \`;
                    container.appendChild(card);
                });
            } catch (error) {
                document.getElementById('productsContainer').innerHTML = '<div style="text-align: center; padding: 2rem; grid-column: 1 / -1;">Error loading products</div>';
            }
        }
        
        loadProducts();
    </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`👑 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🏠 Homepage: http://localhost:${PORT}`);
});
