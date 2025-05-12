const express = require('express');
const router = express.Router();
const { query } = require('../database/db');

// Get all books with filtering options
router.get('/', async (req, res) => {
  try {
    const { title, author, category, available } = req.query;
    
    let sql = `
      SELECT b.book_id, b.title, b.isbn, b.published_year, b.available,
             a.author_id, a.name AS author_name,
             c.category_id, c.name AS category_name
      FROM Books b
      JOIN Authors a ON b.author_id = a.author_id
      JOIN Categories c ON b.category_id = c.category_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (title) {
      sql += ' AND b.title LIKE ?';
      params.push(`%${title}%`);
    }
    
    if (author) {
      sql += ' AND a.name LIKE ?';
      params.push(`%${author}%`);
    }
    
    if (category) {
      sql += ' AND c.name LIKE ?';
      params.push(`%${category}%`);
    }
    
    if (available === 'true') {
      sql += ' AND b.available = 1';
    } else if (available === 'false') {
      sql += ' AND b.available = 0';
    }
    
    sql += ' ORDER BY b.title';
    
    const books = await query(sql, params);
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific book by ID
router.get('/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    
    const sql = `
      SELECT b.book_id, b.title, b.isbn, b.published_year, b.available,
             a.author_id, a.name AS author_name, a.bio AS author_bio,
             c.category_id, c.name AS category_name
      FROM Books b
      JOIN Authors a ON b.author_id = a.author_id
      JOIN Categories c ON b.category_id = c.category_id
      WHERE b.book_id = ?
    `;
    
    const books = await query(sql, [bookId]);
    
    if (books.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(books[0]);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get book borrowing history
router.get('/:id/history', async (req, res) => {
  try {
    const bookId = req.params.id;
    
    const sql = `
      SELECT bb.borrow_id, bb.borrow_date, bb.due_date, bb.return_date,
             u.user_id, u.username, u.full_name
      FROM Borrowed_Books bb
      JOIN Users u ON bb.user_id = u.user_id
      WHERE bb.book_id = ?
      ORDER BY bb.borrow_date DESC
    `;
    
    const history = await query(sql, [bookId]);
    res.json(history);
  } catch (error) {
    console.error('Error fetching book history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM Categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get authors
router.get('/authors/all', async (req, res) => {
  try {
    const authors = await query('SELECT * FROM Authors ORDER BY name');
    res.json(authors);
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get top borrowed books
router.get('/stats/top-borrowed', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    
    const sql = `
      SELECT b.book_id, b.title, a.name AS author_name, COUNT(bb.book_id) AS borrow_count
      FROM Borrowed_Books bb
      JOIN Books b ON bb.book_id = b.book_id
      JOIN Authors a ON b.author_id = a.author_id
      GROUP BY bb.book_id
      ORDER BY borrow_count DESC
      LIMIT ?
    `;
    
    const topBooks = await query(sql, [parseInt(limit)]);
    res.json(topBooks);
  } catch (error) {
    console.error('Error fetching top borrowed books:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 