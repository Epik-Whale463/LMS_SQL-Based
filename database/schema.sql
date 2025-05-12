-- Library Management System Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS library_management;
USE library_management;

-- Authors table
CREATE TABLE IF NOT EXISTS Authors (
    author_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT
);

-- Categories table
CREATE TABLE IF NOT EXISTS Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Books table
CREATE TABLE IF NOT EXISTS Books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author_id INT,
    category_id INT,
    isbn VARCHAR(20) UNIQUE,
    published_year INT,
    available INT DEFAULT 1,
    FOREIGN KEY (author_id) REFERENCES Authors(author_id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(200),
    role ENUM('admin', 'member') NOT NULL DEFAULT 'member',
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Borrowed Books table
CREATE TABLE IF NOT EXISTS Borrowed_Books (
    borrow_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    book_id INT,
    borrow_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    due_date DATE NOT NULL,
    return_date DATE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (book_id) REFERENCES Books(book_id) ON DELETE SET NULL
);

-- Stored procedure to borrow a book
DELIMITER $$

CREATE PROCEDURE borrow_book(IN p_user_id INT, IN p_book_id INT, IN p_due_days INT)
BEGIN
    DECLARE book_available INT;

    -- Check if book is available
    SELECT available INTO book_available FROM Books WHERE book_id = p_book_id;

    IF book_available = 1 THEN
        -- Start transaction
        START TRANSACTION;
        
        -- Mark the book as borrowed
        UPDATE Books SET available = 0 WHERE book_id = p_book_id;

        -- Add to borrowed books
        INSERT INTO Borrowed_Books (user_id, book_id, borrow_date, due_date)
        VALUES (p_user_id, p_book_id, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL p_due_days DAY));
        
        -- Commit transaction
        COMMIT;
        
        SELECT 'Book borrowed successfully' AS message;
    ELSE
        SELECT 'Book is not available for borrowing' AS message;
    END IF;
END $$

-- Stored procedure to return a book
CREATE PROCEDURE return_book(IN p_borrow_id INT)
BEGIN
    DECLARE v_book_id INT;
    DECLARE v_return_date DATE;
    
    -- Get book_id and check if already returned
    SELECT book_id, return_date INTO v_book_id, v_return_date 
    FROM Borrowed_Books 
    WHERE borrow_id = p_borrow_id;
    
    IF v_book_id IS NULL THEN
        SELECT 'Borrow record not found' AS message;
    ELSEIF v_return_date IS NOT NULL THEN
        SELECT 'Book already returned' AS message;
    ELSE
        -- Start transaction
        START TRANSACTION;
        
        -- Update the book status
        UPDATE Books SET available = 1 WHERE book_id = v_book_id;
        
        -- Update borrowed books record
        UPDATE Borrowed_Books SET return_date = CURRENT_DATE WHERE borrow_id = p_borrow_id;
        
        -- Commit transaction
        COMMIT;
        
        SELECT 'Book returned successfully' AS message;
    END IF;
END $$

-- Trigger to prevent overdue borrowing
CREATE TRIGGER prevent_overdue_borrowing
BEFORE INSERT ON Borrowed_Books
FOR EACH ROW
BEGIN
    DECLARE overdue_count INT;

    -- Check if the user has any overdue books
    SELECT COUNT(*) INTO overdue_count
    FROM Borrowed_Books
    WHERE user_id = NEW.user_id 
    AND return_date IS NULL 
    AND due_date < CURRENT_DATE;

    IF overdue_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User has overdue books and cannot borrow more books';
    END IF;
END $$

DELIMITER ;

-- Sample data for testing
INSERT INTO Categories (name) VALUES 
('Fiction'), ('Non-Fiction'), ('Science'), ('History'), ('Biography');

INSERT INTO Authors (name, bio) VALUES 
('J.K. Rowling', 'British author best known for the Harry Potter series'),
('George Orwell', 'English novelist and essayist'),
('Stephen Hawking', 'Theoretical physicist and cosmologist'),
('Jane Austen', 'English novelist known for her romance novels'),
('Walter Isaacson', 'American writer and journalist');

INSERT INTO Books (title, author_id, category_id, isbn, published_year, available) VALUES 
('Harry Potter and the Philosopher''s Stone', 1, 1, '9780747532743', 1997, 1),
('1984', 2, 1, '9780451524935', 1949, 1),
('A Brief History of Time', 3, 3, '9780553380163', 1988, 1),
('Pride and Prejudice', 4, 1, '9780486284736', 1813, 1),
('Steve Jobs', 5, 5, '9781451648539', 2011, 1),
('Animal Farm', 2, 1, '9780451526342', 1945, 1),
('Sense and Sensibility', 4, 1, '9780141439662', 1811, 1),
('The Grand Design', 3, 3, '9780553384666', 2010, 1);

INSERT INTO Users (username, password, email, full_name, role) VALUES
('admin', '$2b$10$PZHAUmVQ.WDe3TjUVU38OOESzXZY45.iF0nGFazXyp3sKsAB4O8qy', 'admin@library.com', 'System Administrator', 'admin'),
('john', '$2b$10$wQpmZEDvD9CrS8d.d5haMOGbMdI2eG9mQSKGTBw0b3YtEWyGCCWDG', 'john@example.com', 'John Smith', 'member'),
('jane', '$2b$10$1I49foKLJGgXDU4cTVGoXe4YcJcVZ.uqfb3QR0c1iqyWJgwNV5kWm', 'jane@example.com', 'Jane Doe', 'member');
-- Passwords in the sample data are hashed versions of 'password123' 