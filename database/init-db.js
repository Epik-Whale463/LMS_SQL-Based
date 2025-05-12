require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const init = async () => {
  try {
    console.log('Starting database initialization...');
    
    // Create connection without database name for initial setup
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'charan',
      password: process.env.DB_PASSWORD || 'root',
      multipleStatements: true
    });
    
    console.log('Connected to MySQL server');
    
    // Read the SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the SQL file
    console.log('Running schema script...');
    await connection.query(schemaSql);
    console.log('Schema created successfully');
    
    // Close the connection
    await connection.end();
    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

init(); 