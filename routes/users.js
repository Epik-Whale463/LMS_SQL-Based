const express = require('express');
const router = express.Router();
const { query } = require('../database/db');

// Get current user's borrowed books
router.get('/my-books', async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const sql = `
      SELECT bb.borrow_id, bb.borrow_date, bb.due_date, bb.return_date,
             b.book_id, b.title, b.isbn,
             a.name AS author_name,
             c.name AS category_name,
             CASE 
               WHEN bb.return_date IS NULL AND bb.due_date < CURDATE() THEN 'Overdue'
               WHEN bb.return_date IS NULL THEN 'Borrowed'
               ELSE 'Returned'
             END AS status
      FROM Borrowed_Books bb
      JOIN Books b ON bb.book_id = b.book_id
      JOIN Authors a ON b.author_id = a.author_id
      JOIN Categories c ON b.category_id = c.category_id
      WHERE bb.user_id = ?
      ORDER BY bb.borrow_date DESC
    `;
    
    const books = await query(sql, [userId]);
    res.json(books);
  } catch (error) {
    console.error('Error fetching user books:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Borrow a book
router.post('/borrow/:bookId', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const bookId = req.params.bookId;
    const dueDays = req.body.dueDays || 14; // Default to 14 days
    
    // Check if book is available
    const bookCheck = await query('SELECT available FROM Books WHERE book_id = ?', [bookId]);
    
    if (bookCheck.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    if (bookCheck[0].available !== 1) {
      return res.status(400).json({ message: 'Book is not available for borrowing' });
    }
    
    // Check if user has overdue books
    const overdueCheck = await query(`
      SELECT COUNT(*) AS overdue_count
      FROM Borrowed_Books
      WHERE user_id = ? AND return_date IS NULL AND due_date < CURDATE()
    `, [userId]);
    
    if (overdueCheck[0].overdue_count > 0) {
      return res.status(400).json({ message: 'You have overdue books. Please return them before borrowing more books.' });
    }
    
    // Start transaction
    await query('START TRANSACTION');
    
    // Mark book as unavailable
    await query('UPDATE Books SET available = 0 WHERE book_id = ?', [bookId]);
    
    // Create borrow record
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(dueDays));
    
    const borrowResult = await query(`
      INSERT INTO Borrowed_Books (user_id, book_id, borrow_date, due_date)
      VALUES (?, ?, CURDATE(), ?)
    `, [userId, bookId, dueDate.toISOString().split('T')[0]]);
    
    // Commit transaction
    await query('COMMIT');
    
    res.status(201).json({
      message: 'Book borrowed successfully',
      borrowId: borrowResult.insertId,
      dueDate: dueDate.toISOString().split('T')[0]
    });
  } catch (error) {
    // Rollback transaction in case of error
    await query('ROLLBACK');
    console.error('Error borrowing book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Return a book
router.post('/return/:borrowId', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const borrowId = req.params.borrowId;
    
    // Check if borrow record exists and belongs to the user
    const borrowCheck = await query(`
      SELECT bb.book_id, bb.return_date
      FROM Borrowed_Books bb
      WHERE bb.borrow_id = ? AND bb.user_id = ?
    `, [borrowId, userId]);
    
    if (borrowCheck.length === 0) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }
    
    if (borrowCheck[0].return_date !== null) {
      return res.status(400).json({ message: 'Book already returned' });
    }
    
    const bookId = borrowCheck[0].book_id;
    
    // Start transaction
    await query('START TRANSACTION');
    
    // Mark book as available
    await query('UPDATE Books SET available = 1 WHERE book_id = ?', [bookId]);
    
    // Update borrow record
    await query(`
      UPDATE Borrowed_Books SET return_date = CURDATE()
      WHERE borrow_id = ?
    `, [borrowId]);
    
    // Commit transaction
    await query('COMMIT');
    
    res.json({ message: 'Book returned successfully' });
  } catch (error) {
    // Rollback transaction in case of error
    await query('ROLLBACK');
    console.error('Error returning book:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's account details
router.get('/profile', async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const userQuery = await query(`
      SELECT user_id, username, email, full_name, role, registration_date
      FROM Users WHERE user_id = ?
    `, [userId]);
    
    if (userQuery.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userQuery[0];
    
    // Get borrowing statistics
    const statsQuery = await query(`
      SELECT 
        COUNT(borrow_id) AS total_borrowed,
        SUM(CASE WHEN return_date IS NULL THEN 1 ELSE 0 END) AS currently_borrowed,
        SUM(CASE WHEN return_date IS NULL AND due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue
      FROM Borrowed_Books
      WHERE user_id = ?
    `, [userId]);
    
    res.json({
      ...user,
      stats: statsQuery[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 