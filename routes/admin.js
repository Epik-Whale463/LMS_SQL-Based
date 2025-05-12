const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const bcrypt = require('bcrypt');

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await query(`
      SELECT u.user_id, u.username, u.email, u.full_name, u.role, u.registration_date,
             COUNT(bb.borrow_id) AS total_borrowed,
             SUM(CASE WHEN bb.return_date IS NULL THEN 1 ELSE 0 END) AS currently_borrowed,
             SUM(CASE WHEN bb.return_date IS NULL AND bb.due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue
      FROM Users u
      LEFT JOIN Borrowed_Books bb ON u.user_id = bb.user_id
      GROUP BY u.user_id
      ORDER BY u.username
    `);
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new user
router.post('/users', async (req, res) => {
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
      email,
      fullName,
      role: role || 'member'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new book
router.post('/books', async (req, res) => {
  try {
    const { title, authorId, categoryId, isbn, publishedYear } = req.body;
    
    // Validate input
    if (!title || !authorId || !categoryId) {
      return res.status(400).json({ message: 'Title, author, and category are required' });
    }
    
    // Check if ISBN already exists
    if (isbn) {
      const existingBooks = await query('SELECT * FROM Books WHERE isbn = ?', [isbn]);
      if (existingBooks.length > 0) {
        return res.status(400).json({ message: 'Book with this ISBN already exists' });
      }
    }
    
    // Add the book
    const result = await query(
      'INSERT INTO Books (title, author_id, category_id, isbn, published_year, available) VALUES (?, ?, ?, ?, ?, 1)',
      [title, authorId, categoryId, isbn, publishedYear]
    );
    
    res.status(201).json({
      bookId: result.insertId,
      title,
      authorId,
      categoryId,
      isbn,
      publishedYear,
      available: 1
    });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a book
router.put('/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const { title, authorId, categoryId, isbn, publishedYear, available } = req.body;
    
    // Check if book exists
    const existingBooks = await query('SELECT * FROM Books WHERE book_id = ?', [bookId]);
    if (existingBooks.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if ISBN already exists on another book
    if (isbn) {
      const existingIsbn = await query('SELECT * FROM Books WHERE isbn = ? AND book_id != ?', [isbn, bookId]);
      if (existingIsbn.length > 0) {
        return res.status(400).json({ message: 'Another book with this ISBN already exists' });
      }
    }
    
    // Update the book
    await query(
      'UPDATE Books SET title = ?, author_id = ?, category_id = ?, isbn = ?, published_year = ?, available = ? WHERE book_id = ?',
      [title, authorId, categoryId, isbn, publishedYear, available, bookId]
    );
    
    res.json({
      bookId: parseInt(bookId),
      title,
      authorId,
      categoryId,
      isbn,
      publishedYear,
      available
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a book
router.delete('/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    
    // Check if book exists
    const existingBooks = await query('SELECT * FROM Books WHERE book_id = ?', [bookId]);
    if (existingBooks.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if book is borrowed
    const borrowedBooks = await query(
      'SELECT * FROM Borrowed_Books WHERE book_id = ? AND return_date IS NULL',
      [bookId]
    );
    
    if (borrowedBooks.length > 0) {
      return res.status(400).json({ message: 'Cannot delete a book that is currently borrowed' });
    }
    
    // Delete the book
    await query('DELETE FROM Books WHERE book_id = ?', [bookId]);
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new author
router.post('/authors', async (req, res) => {
  try {
    const { name, bio } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Author name is required' });
    }
    
    const result = await query(
      'INSERT INTO Authors (name, bio) VALUES (?, ?)',
      [name, bio || null]
    );
    
    res.status(201).json({
      authorId: result.insertId,
      name,
      bio
    });
  } catch (error) {
    console.error('Error adding author:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new category
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const result = await query(
      'INSERT INTO Categories (name) VALUES (?)',
      [name]
    );
    
    res.status(201).json({
      categoryId: result.insertId,
      name
    });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get overdue books
router.get('/overdue', async (req, res) => {
  try {
    const overdueBooks = await query(`
      SELECT bb.borrow_id, bb.borrow_date, bb.due_date, 
             DATEDIFF(CURDATE(), bb.due_date) AS days_overdue,
             b.book_id, b.title, 
             u.user_id, u.username, u.full_name, u.email
      FROM Borrowed_Books bb
      JOIN Books b ON bb.book_id = b.book_id
      JOIN Users u ON bb.user_id = u.user_id
      WHERE bb.return_date IS NULL AND bb.due_date < CURDATE()
      ORDER BY days_overdue DESC
    `);
    
    res.json(overdueBooks);
  } catch (error) {
    console.error('Error fetching overdue books:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    // Total books
    const totalBooks = await query('SELECT COUNT(*) AS count FROM Books');
    
    // Available books
    const availableBooks = await query('SELECT COUNT(*) AS count FROM Books WHERE available = 1');
    
    // Borrowed books
    const borrowedBooks = await query('SELECT COUNT(*) AS count FROM Books WHERE available = 0');
    
    // Total users
    const totalUsers = await query('SELECT COUNT(*) AS count FROM Users');
    
    // Total authors
    const totalAuthors = await query('SELECT COUNT(*) AS count FROM Authors');
    
    // Total categories
    const totalCategories = await query('SELECT COUNT(*) AS count FROM Categories');
    
    // Overdue books
    const overdueBooks = await query(`
      SELECT COUNT(*) AS count
      FROM Borrowed_Books
      WHERE return_date IS NULL AND due_date < CURDATE()
    `);
    
    res.json({
      totalBooks: totalBooks[0].count,
      availableBooks: availableBooks[0].count,
      borrowedBooks: borrowedBooks[0].count,
      totalUsers: totalUsers[0].count,
      totalAuthors: totalAuthors[0].count,
      totalCategories: totalCategories[0].count,
      overdueBooks: overdueBooks[0].count
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 