-- Common SQL Queries for Library Management System

-- 1. View all available books with author and category
SELECT b.book_id, b.title, a.name AS author_name, c.name AS category_name, b.isbn, b.published_year
FROM Books b
JOIN Authors a ON b.author_id = a.author_id
JOIN Categories c ON b.category_id = c.category_id
WHERE b.available = 1
ORDER BY b.title;

-- 2. List books borrowed by a specific user
SELECT bb.borrow_id, b.title, a.name AS author_name, 
       bb.borrow_date, bb.due_date, bb.return_date,
       CASE 
           WHEN bb.return_date IS NULL AND bb.due_date < CURDATE() THEN 'Overdue'
           WHEN bb.return_date IS NULL THEN 'Borrowed'
           ELSE 'Returned'
       END AS status
FROM Borrowed_Books bb
JOIN Books b ON bb.book_id = b.book_id
JOIN Authors a ON b.author_id = a.author_id
WHERE bb.user_id = ?  -- Replace ? with user_id
ORDER BY bb.borrow_date DESC;

-- 3. All books in a specific category
SELECT b.book_id, b.title, a.name AS author_name, b.published_year, b.available
FROM Books b
JOIN Authors a ON b.author_id = a.author_id
WHERE b.category_id = ?  -- Replace ? with category_id
ORDER BY b.title;

-- 4. Search books by title or author
SELECT b.book_id, b.title, a.name AS author_name, c.name AS category_name, 
       b.published_year, b.available
FROM Books b
JOIN Authors a ON b.author_id = a.author_id
JOIN Categories c ON b.category_id = c.category_id
WHERE b.title LIKE CONCAT('%', ?, '%')  -- Replace ? with search term
   OR a.name LIKE CONCAT('%', ?, '%')   -- Replace ? with search term
ORDER BY b.title;

-- 5. Top borrowed books
SELECT b.book_id, b.title, a.name AS author_name, COUNT(bb.book_id) AS borrow_count
FROM Borrowed_Books bb
JOIN Books b ON bb.book_id = b.book_id
JOIN Authors a ON b.author_id = a.author_id
GROUP BY bb.book_id
ORDER BY borrow_count DESC
LIMIT 10;

-- 6. Overdue books
SELECT bb.borrow_id, u.username, u.full_name, b.title, 
       bb.borrow_date, bb.due_date, 
       DATEDIFF(CURDATE(), bb.due_date) AS days_overdue
FROM Borrowed_Books bb
JOIN Books b ON bb.book_id = b.book_id
JOIN Users u ON bb.user_id = u.user_id
WHERE bb.return_date IS NULL 
  AND bb.due_date < CURDATE()
ORDER BY days_overdue DESC;

-- 7. Books borrowed by each user (summary)
SELECT u.username, u.full_name, COUNT(bb.borrow_id) AS total_borrowed,
       SUM(CASE WHEN bb.return_date IS NULL THEN 1 ELSE 0 END) AS currently_borrowed,
       SUM(CASE WHEN bb.return_date IS NULL AND bb.due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue
FROM Users u
LEFT JOIN Borrowed_Books bb ON u.user_id = bb.user_id
GROUP BY u.user_id
ORDER BY total_borrowed DESC;

-- 8. Books by an author
SELECT b.book_id, b.title, c.name AS category_name, b.published_year, b.available
FROM Books b
JOIN Categories c ON b.category_id = c.category_id
WHERE b.author_id = ?  -- Replace ? with author_id
ORDER BY b.published_year DESC;

-- 9. Book borrowing history
SELECT bb.borrow_id, u.username, u.full_name,
       bb.borrow_date, bb.due_date, bb.return_date
FROM Borrowed_Books bb
JOIN Users u ON bb.user_id = u.user_id
WHERE bb.book_id = ?  -- Replace ? with book_id
ORDER BY bb.borrow_date DESC;

-- 10. User authentication query
SELECT user_id, username, password, email, full_name, role
FROM Users
WHERE username = ?;  -- Replace ? with username 