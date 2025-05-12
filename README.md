# Library Management System

A modern SQL-focused Library Management System built with MySQL, Node.js, Express, and vanilla JavaScript.


## UI

![image](https://github.com/user-attachments/assets/37aad0fb-73d7-4f1d-97a6-32bfe35dd7d9)

## Features

- Complete library management functionality
- Beautiful, responsive UI
- Role-based access control (Admin and Member roles)
- Advanced SQL operations (joins, transactions, stored procedures)
- Book browsing, searching, and filtering
- Borrowing and returning books
- Admin dashboard for managing books, users, authors, and categories
- Overdue book tracking
- User profile and borrowing history

## Tech Stack

- **Database**: MySQL
- **Backend**: Node.js with Express
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Tools**: MySQL Workbench, Visual Studio Code

## Database Structure

The database consists of the following tables:

- **Authors**: Store author information
- **Categories**: Book categories
- **Books**: Store book details with references to authors and categories
- **Users**: Store user information with roles
- **Borrowed_Books**: Track borrowed books, due dates, and return dates

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/library-management-system.git
cd library-management-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment variables**

Create a `.env` file in the root directory with the following:

```
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=library_management
DB_PORT=3306

# Server Configuration
PORT=3000
SESSION_SECRET=your_session_secret

# Other Settings
NODE_ENV=development
```

4. **Initialize the database**

```bash
npm run init-db
```

5. **Start the server**

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

6. **Access the application**

Open your browser and navigate to `http://localhost:3000`

## Usage

### Default Login Credentials

- **Admin User**:
  - Username: admin
  - Password: password123

- **Member User**:
  - Username: john
  - Password: password123

### User Roles

#### Member

- Browse and search books
- Borrow and return books
- View borrowing history
- Access personal profile

#### Admin

- All member privileges
- Manage books (add, edit, delete)
- Manage users, authors, and categories
- View overdue books and user statistics

## Project Structure

```
library-management-system/
├── database/             # Database scripts and models
│   ├── schema.sql        # Database schema
│   ├── queries.sql       # Common SQL queries
│   ├── init-db.js        # Database initialization script
│   └── db.js             # Database connection
├── routes/               # API routes
│   ├── auth.js           # Authentication routes
│   ├── books.js          # Book-related routes
│   ├── users.js          # User-related routes
│   └── admin.js          # Admin-only routes
├── public/               # Frontend files
│   ├── css/              # Stylesheets
│   │   └── style.css     # Main stylesheet
│   ├── js/               # JavaScript files
│   │   ├── auth.js       # Authentication handlers
│   │   ├── app.js        # Main application logic
│   │   ├── books.js      # Book-related functions
│   │   └── admin.js      # Admin-only functions
│   └── index.html        # Main HTML file
├── server.js             # Express server
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## SQL Features Demonstrated

- **Table Design & Relationships**: Proper foreign key constraints and relationships
- **Indexes**: For optimized queries
- **Joins**: Multiple table joins for complex data retrieval
- **Transactions**: For maintaining data integrity
- **Stored Procedures**: For common operations like borrowing/returning books
- **Triggers**: To enforce business rules (e.g., preventing overdue borrowing)
- **Views**: For simplified data access
- **Subqueries**: For complex data operations

## License

MIT

## Author

Rama Charan Pisupati

---
