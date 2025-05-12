// Admin Module
const Admin = (() => {
  // DOM Elements
  const adminBooksTable = document.getElementById('admin-books-table');
  const adminBookModal = document.getElementById('admin-book-modal');
  const bookForm = document.getElementById('book-form');
  const bookModalTitle = document.getElementById('book-modal-title');
  const bookId = document.getElementById('book-id');
  const bookTitle = document.getElementById('book-title');
  const bookAuthor = document.getElementById('book-author');
  const bookCategory = document.getElementById('book-category');
  const bookIsbn = document.getElementById('book-isbn');
  const bookYear = document.getElementById('book-year');
  const addBookBtn = document.getElementById('add-book-btn');
  
  const usersTable = document.getElementById('users-table');
  const userModal = document.getElementById('user-modal');
  const userForm = document.getElementById('user-form');
  const addUserBtn = document.getElementById('add-user-btn');
  
  const authorsTable = document.getElementById('authors-table');
  const authorModal = document.getElementById('author-modal');
  const authorForm = document.getElementById('author-form');
  const addAuthorBtn = document.getElementById('add-author-btn');
  
  const categoriesTable = document.getElementById('categories-table');
  const categoryModal = document.getElementById('category-modal');
  const categoryForm = document.getElementById('category-form');
  const addCategoryBtn = document.getElementById('add-category-btn');
  
  const overdueTable = document.getElementById('overdue-books-table');
  
  // Load admin data based on active tab
  const loadAdminData = () => {
    const activeTab = document.querySelector('#admin-page .tab-btn.active');
    if (!activeTab) return;
    
    switch (activeTab.dataset.tab) {
      case 'manage-books':
        loadAdminBooks();
        break;
      case 'manage-users':
        loadUsers();
        break;
      case 'manage-authors':
        loadAuthors();
        break;
      case 'manage-categories':
        loadCategories();
        break;
      case 'overdue-books':
        loadOverdueBooks();
        break;
    }
  };
  
  // Load admin books
  const loadAdminBooks = async () => {
    try {
      const response = await fetch('/api/books');
      
      if (response.ok) {
        const books = await response.json();
        renderAdminBooks(books);
      }
      
      // Load authors and categories for the book form
      loadBookFormOptions();
    } catch (error) {
      console.error('Error loading admin books:', error);
      App.showToast('Failed to load books', 'error');
    }
  };
  
  // Load book form options (authors and categories)
  const loadBookFormOptions = async () => {
    try {
      // Load authors
      const authorsResponse = await fetch('/api/books/authors/all');
      
      if (authorsResponse.ok) {
        const authors = await authorsResponse.json();
        
        // Clear existing options
        bookAuthor.innerHTML = '';
        
        // Add new options
        authors.forEach(author => {
          const option = document.createElement('option');
          option.value = author.author_id;
          option.textContent = author.name;
          bookAuthor.appendChild(option);
        });
      }
      
      // Load categories
      const categoriesResponse = await fetch('/api/books/categories/all');
      
      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        
        // Clear existing options
        bookCategory.innerHTML = '';
        
        // Add new options
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.category_id;
          option.textContent = category.name;
          bookCategory.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading book form options:', error);
    }
  };
  
  // Render admin books table
  const renderAdminBooks = (books) => {
    const tableBody = adminBooksTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (books.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No books found</td></tr>';
      return;
    }
    
    books.forEach(book => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${book.book_id}</td>
        <td>${book.title}</td>
        <td>${book.author_name}</td>
        <td>${book.category_name}</td>
        <td>${book.isbn || 'N/A'}</td>
        <td>
          <span class="book-status ${book.available ? 'status-available' : 'status-borrowed'}">
            ${book.available ? 'Available' : 'Borrowed'}
          </span>
        </td>
        <td>
          <button class="btn edit-book-btn" data-id="${book.book_id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn delete-book-btn" data-id="${book.book_id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    const editButtons = tableBody.querySelectorAll('.edit-book-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const bookId = e.target.closest('.edit-book-btn').dataset.id;
        await openEditBookModal(bookId);
      });
    });
    
    const deleteButtons = tableBody.querySelectorAll('.delete-book-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const bookId = e.target.closest('.delete-book-btn').dataset.id;
        await deleteBook(bookId);
      });
    });
  };
  
  // Open edit book modal
  const openEditBookModal = async (bookId) => {
    try {
      const response = await fetch(`/api/books/${bookId}`);
      
      if (response.ok) {
        const book = await response.json();
        
        // Update modal title
        bookModalTitle.textContent = 'Edit Book';
        
        // Fill form fields
        document.getElementById('book-id').value = book.book_id;
        bookTitle.value = book.title;
        bookIsbn.value = book.isbn || '';
        bookYear.value = book.published_year || '';
        
        // Select author and category
        for (let i = 0; i < bookAuthor.options.length; i++) {
          if (bookAuthor.options[i].value == book.author_id) {
            bookAuthor.selectedIndex = i;
            break;
          }
        }
        
        for (let i = 0; i < bookCategory.options.length; i++) {
          if (bookCategory.options[i].value == book.category_id) {
            bookCategory.selectedIndex = i;
            break;
          }
        }
        
        // Show modal
        adminBookModal.style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading book details:', error);
      App.showToast('Failed to load book details', 'error');
    }
  };
  
  // Add or update a book
  const saveBook = async (formData) => {
    try {
      const isEdit = formData.bookId ? true : false;
      const url = isEdit ? `/api/admin/books/${formData.bookId}` : '/api/admin/books';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          authorId: formData.authorId,
          categoryId: formData.categoryId,
          isbn: formData.isbn,
          publishedYear: formData.publishedYear,
          available: formData.available
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save book');
      }
      
      // Close modal
      adminBookModal.style.display = 'none';
      
      // Show success message
      App.showToast(`Book ${isEdit ? 'updated' : 'added'} successfully`, 'success');
      
      // Reload books
      loadAdminBooks();
      
      return true;
    } catch (error) {
      console.error('Error saving book:', error);
      App.showToast(error.message, 'error');
      return false;
    }
  };
  
  // Delete a book
  const deleteBook = async (bookId) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this book?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete book');
      }
      
      // Show success message
      App.showToast('Book deleted successfully', 'success');
      
      // Reload books
      loadAdminBooks();
      
      return true;
    } catch (error) {
      console.error('Error deleting book:', error);
      App.showToast(error.message, 'error');
      return false;
    }
  };
  
  // Load users
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      
      if (response.ok) {
        const users = await response.json();
        renderUsers(users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      App.showToast('Failed to load users', 'error');
    }
  };
  
  // Render users table
  const renderUsers = (users) => {
    const tableBody = usersTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
      return;
    }
    
    users.forEach(user => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${user.user_id}</td>
        <td>${user.username}</td>
        <td>${user.email || 'N/A'}</td>
        <td>${user.full_name || 'N/A'}</td>
        <td>${user.role}</td>
        <td>${user.currently_borrowed || 0}</td>
        <td>${user.overdue || 0}</td>
      `;
      
      tableBody.appendChild(row);
    });
  };
  
  // Add a new user
  const addUser = async (formData) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add user');
      }
      
      // Close modal
      userModal.style.display = 'none';
      
      // Show success message
      App.showToast('User added successfully', 'success');
      
      // Reload users
      loadUsers();
      
      return true;
    } catch (error) {
      console.error('Error adding user:', error);
      App.showToast(error.message, 'error');
      return false;
    }
  };
  
  // Load authors
  const loadAuthors = async () => {
    try {
      const response = await fetch('/api/books/authors/all');
      
      if (response.ok) {
        const authors = await response.json();
        renderAuthors(authors);
      }
    } catch (error) {
      console.error('Error loading authors:', error);
      App.showToast('Failed to load authors', 'error');
    }
  };
  
  // Render authors table
  const renderAuthors = (authors) => {
    const tableBody = authorsTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (authors.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No authors found</td></tr>';
      return;
    }
    
    authors.forEach(author => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${author.author_id}</td>
        <td>${author.name}</td>
        <td>${author.bio || 'N/A'}</td>
        <td>${author.book_count || 0}</td>
      `;
      
      tableBody.appendChild(row);
    });
  };
  
  // Add a new author
  const addAuthor = async (formData) => {
    try {
      const response = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add author');
      }
      
      // Close modal
      authorModal.style.display = 'none';
      
      // Show success message
      App.showToast('Author added successfully', 'success');
      
      // Reload authors
      loadAuthors();
      
      return true;
    } catch (error) {
      console.error('Error adding author:', error);
      App.showToast(error.message, 'error');
      return false;
    }
  };
  
  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/books/categories/all');
      
      if (response.ok) {
        const categories = await response.json();
        renderCategories(categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      App.showToast('Failed to load categories', 'error');
    }
  };
  
  // Render categories table
  const renderCategories = (categories) => {
    const tableBody = categoriesTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (categories.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No categories found</td></tr>';
      return;
    }
    
    categories.forEach(category => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${category.category_id}</td>
        <td>${category.name}</td>
        <td>${category.book_count || 0}</td>
      `;
      
      tableBody.appendChild(row);
    });
  };
  
  // Add a new category
  const addCategory = async (formData) => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add category');
      }
      
      // Close modal
      categoryModal.style.display = 'none';
      
      // Show success message
      App.showToast('Category added successfully', 'success');
      
      // Reload categories
      loadCategories();
      
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      App.showToast(error.message, 'error');
      return false;
    }
  };
  
  // Load overdue books
  const loadOverdueBooks = async () => {
    try {
      const response = await fetch('/api/admin/overdue');
      
      if (response.ok) {
        const overdueBooks = await response.json();
        renderOverdueBooks(overdueBooks);
      }
    } catch (error) {
      console.error('Error loading overdue books:', error);
      App.showToast('Failed to load overdue books', 'error');
    }
  };
  
  // Render overdue books table
  const renderOverdueBooks = (overdueBooks) => {
    const tableBody = overdueTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (overdueBooks.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No overdue books found</td></tr>';
      return;
    }
    
    overdueBooks.forEach(book => {
      const row = document.createElement('tr');
      
      // Format dates
      const borrowDate = new Date(book.borrow_date).toLocaleDateString();
      const dueDate = new Date(book.due_date).toLocaleDateString();
      
      row.innerHTML = `
        <td>${book.username} (${book.full_name})</td>
        <td>${book.title}</td>
        <td>${borrowDate}</td>
        <td>${dueDate}</td>
        <td>${book.days_overdue}</td>
      `;
      
      tableBody.appendChild(row);
    });
  };
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === adminBookModal) {
      adminBookModal.style.display = 'none';
    } else if (e.target === userModal) {
      userModal.style.display = 'none';
    } else if (e.target === authorModal) {
      authorModal.style.display = 'none';
    } else if (e.target === categoryModal) {
      categoryModal.style.display = 'none';
    }
  });
  
  // Close modals when clicking close button
  document.querySelectorAll('.modal .close').forEach(closeButton => {
    closeButton.addEventListener('click', () => {
      const modal = closeButton.closest('.modal');
      modal.style.display = 'none';
    });
  });
  
  // Initialize the module
  const init = () => {
    // Add book button click handler
    addBookBtn.addEventListener('click', () => {
      // Clear form
      bookForm.reset();
      bookId.value = '';
      
      // Update modal title
      bookModalTitle.textContent = 'Add New Book';
      
      // Show modal
      adminBookModal.style.display = 'block';
    });
    
    // Book form submission
    bookForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        bookId: bookId.value,
        title: bookTitle.value,
        authorId: bookAuthor.value,
        categoryId: bookCategory.value,
        isbn: bookIsbn.value,
        publishedYear: bookYear.value,
        available: 1 // New books are always available
      };
      
      await saveBook(formData);
    });
    
    // Add user button click handler
    addUserBtn.addEventListener('click', () => {
      // Clear form
      userForm.reset();
      
      // Show modal
      userModal.style.display = 'block';
    });
    
    // User form submission
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        username: document.getElementById('user-username').value,
        email: document.getElementById('user-email').value,
        fullName: document.getElementById('user-fullname').value,
        password: document.getElementById('user-password').value,
        role: document.getElementById('user-role').value
      };
      
      await addUser(formData);
    });
    
    // Add author button click handler
    addAuthorBtn.addEventListener('click', () => {
      // Clear form
      authorForm.reset();
      
      // Show modal
      authorModal.style.display = 'block';
    });
    
    // Author form submission
    authorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('author-name').value,
        bio: document.getElementById('author-bio').value
      };
      
      await addAuthor(formData);
    });
    
    // Add category button click handler
    addCategoryBtn.addEventListener('click', () => {
      // Clear form
      categoryForm.reset();
      
      // Show modal
      categoryModal.style.display = 'block';
    });
    
    // Category form submission
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('category-name').value
      };
      
      await addCategory(formData);
    });
    
    // Tab switching for admin page
    const adminTabBtns = document.querySelectorAll('#admin-page .tab-btn');
    adminTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        loadAdminData();
      });
    });
  };
  
  // Return public API
  return {
    init,
    loadAdminData,
    loadAdminBooks,
    loadUsers,
    loadAuthors,
    loadCategories,
    loadOverdueBooks
  };
})();

// Initialize admin module when DOM is loaded
document.addEventListener('DOMContentLoaded', Admin.init); 