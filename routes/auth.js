const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { query } = require('../database/db');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Get user from database
    const users = await query('SELECT * FROM Users WHERE username = ?', [username]);
    const user = users[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Set user session
    req.session.user = {
      id: user.user_id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    };
    
    res.json({
      id: user.user_id,
      username: user.username,
      fullName: user.full_name,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Check if user is logged in
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  res.json({
    id: req.session.user.id,
    username: req.session.user.username,
    fullName: req.session.user.fullName,
    role: req.session.user.role
  });
});

// Register route (admin only should use this, but for demo it's available)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, fullName, role } = req.body;
    
    // Validate input
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Username, password, and email are required' });
    }
    
    // Check if user exists
    const existingUsers = await query('SELECT * FROM Users WHERE username = ? OR email = ?', [username, email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const result = await query(
      'INSERT INTO Users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, fullName, role || 'member']
    );
    
    res.status(201).json({
      id: result.insertId,
      username,
      fullName,
      role: role || 'member'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 