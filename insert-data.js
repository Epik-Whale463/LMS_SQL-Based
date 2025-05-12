require('dotenv').config();
const mysql = require('mysql2/promise');

async function insertData() {
  try {
    console.log('Connecting to database...');
    // Get credentials from the .env file
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'library_management'
    });
    
    console.log('Connected to database');
    
    // Insert categories
    console.log('Inserting categories...');
    await conn.execute(`
      INSERT INTO Categories (name) VALUES 
      ('Fiction'), ('Non-Fiction'), ('Science'), ('History'), ('Biography')
    `);
    
    // Insert authors
    console.log('Inserting authors...');
    await conn.execute(`
      INSERT INTO Authors (name, bio) VALUES 
      ('J.K. Rowling', 'British author best known for the Harry Potter series'),
      ('George Orwell', 'English novelist and essayist'),
      ('Stephen Hawking', 'Theoretical physicist and cosmologist'),
      ('Jane Austen', 'English novelist known for romance novels'),
      ('Walter Isaacson', 'American writer and journalist')
    `);
    
    // Insert books
    console.log('Inserting books...');
    await conn.execute(`
      INSERT INTO Books (title, author_id, category_id, isbn, published_year, available) VALUES 
      ('Harry Potter and the Philosopher''s Stone', 1, 1, '9780747532743', 1997, 1),
      ('1984', 2, 1, '9780451524935', 1949, 1),
      ('A Brief History of Time', 3, 3, '9780553380163', 1988, 1),
      ('Pride and Prejudice', 4, 1, '9780486284736', 1813, 1),
      ('Steve Jobs', 5, 5, '9781451648539', 2011, 1)
    `);
    
    // Insert users
    console.log('Inserting users...');
    await conn.execute(`
      INSERT INTO Users (username, password, email, full_name, role) VALUES
      ('admin', '$2b$10$PZHAUmVQ.WDe3TjUVU38OOESzXZY45.iF0nGFazXyp3sKsAB4O8qy', 'admin@library.com', 'System Administrator', 'admin'),
      ('john', '$2b$10$wQpmZEDvD9CrS8d.d5haMOGbMdI2eG9mQSKGTBw0b3YtEWyGCCWDG', 'john@example.com', 'John Smith', 'member'),
      ('jane', '$2b$10$1I49foKLJGgXDU4cTVGoXe4YcJcVZ.uqfb3QR0c1iqyWJgwNV5kWm', 'jane@example.com', 'Jane Doe', 'member')
    `);
    
    console.log('Data inserted successfully');
    await conn.end();
  } catch (error) {
    console.error('Error inserting data:', error);
  }
}

insertData(); 