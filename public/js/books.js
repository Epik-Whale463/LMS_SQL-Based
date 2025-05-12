// Books Module
const Books = (() => {
  // DOM Elements
  let booksGrid, bookModal, modalBookTitle, modalBookAuthor, modalBookCategory, 
      modalBookIsbn, modalBookYear, modalBookStatus, borrowBookBtn, dueDateSelector, 
      confirmBorrowBtn, dueDays, categoryFilter, authorFilter, availabilityFilter, 
      applyFiltersBtn, currentBooksTable, historyBooksTable;
  
  // Initialize DOM elements
  const initDomElements = () => {
    console.log('Initializing Books DOM elements');
    booksGrid = document.getElementById('books-grid');
    bookModal = document.getElementById('book-modal');
    modalBookTitle = document.getElementById('modal-book-title');
    modalBookAuthor = document.getElementById('modal-book-author');
    modalBookCategory = document.getElementById('modal-book-category');
    modalBookIsbn = document.getElementById('modal-book-isbn');
    modalBookYear = document.getElementById('modal-book-year');
    modalBookStatus = document.getElementById('modal-book-status');
    borrowBookBtn = document.getElementById('borrow-book-btn');
    dueDateSelector = document.getElementById('due-date-selector');
    confirmBorrowBtn = document.getElementById('confirm-borrow-btn');
    dueDays = document.getElementById('due-days');
    categoryFilter = document.getElementById('category-filter');
    authorFilter = document.getElementById('author-filter');
    availabilityFilter = document.getElementById('availability-filter');
    applyFiltersBtn = document.getElementById('apply-filters');
    currentBooksTable = document.getElementById('current-books-table');
    historyBooksTable = document.getElementById('history-books-table');

    // Log elements for debugging
    console.log('Books DOM elements:', { 
      booksGrid, bookModal, currentBooksTable, historyBooksTable 
    });
  };
  
  // Current selected book ID
  let selectedBookId = null;
  
  // Load all books
  const loadAllBooks = async (filters = {}) => {
    try {
      // Make sure DOM elements are initialized
      if (!booksGrid) initDomElements();
      
      console.log('Loading all books with filters:', filters);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (filters.title) queryParams.append('title', filters.title);
      if (filters.author) queryParams.append('author', filters.author);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.available !== undefined) queryParams.append('available', filters.available);
      
      const response = await fetch(`/api/books?${queryParams.toString()}`);
      
      if (response.ok) {
        const books = await response.json();
        renderBooksGrid(books);
      }
      
      // Load filter options if not already loaded
      if (categoryFilter && !categoryFilter.options.length) {
        loadFilterOptions();
      }
    } catch (error) {
      console.error('Error loading books:', error);
      App.showToast('Failed to load books', 'error');
    }
  };
  
  // Load filter options (categories, authors)
  const loadFilterOptions = async () => {
    try {
      // Load categories
      const categoriesResponse = await fetch('/api/books/categories/all');
      
      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        
        // Clear existing options except the first one
        while (categoryFilter.options.length > 1) {
          categoryFilter.remove(1);
        }
        
        // Add new options
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.name;
          option.textContent = category.name;
          categoryFilter.appendChild(option);
        });
      }
      
      // Load authors
      const authorsResponse = await fetch('/api/books/authors/all');
      
      if (authorsResponse.ok) {
        const authors = await authorsResponse.json();
        
        // Clear existing options except the first one
        while (authorFilter.options.length > 1) {
          authorFilter.remove(1);
        }
        
        // Add new options
        authors.forEach(author => {
          const option = document.createElement('option');
          option.value = author.name;
          option.textContent = author.name;
          authorFilter.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };
  
  // Render books grid
  const renderBooksGrid = (books) => {
    booksGrid.innerHTML = '';
    
    if (books.length === 0) {
      booksGrid.innerHTML = '<p class="no-results">No books found</p>';
      return;
    }
    
    books.forEach(book => {
      const bookCard = document.createElement('div');
      bookCard.className = 'book-card';
      bookCard.dataset.id = book.book_id;
      
      bookCard.innerHTML = `
        <div class="book-cover">
          <i class="fas fa-book"></i>
        </div>
        <div class="book-info">
          <h3 class="book-title">${book.title}</h3>
          <p class="book-author">by ${book.author_name}</p>
          <span class="book-status ${book.available ? 'status-available' : 'status-borrowed'}">
            ${book.available ? 'Available' : 'Borrowed'}
          </span>
        </div>
      `;
      
      // Open book details modal on click
      bookCard.addEventListener('click', () => {
        openBookDetailsModal(book.book_id);
      });
      
      booksGrid.appendChild(bookCard);
    });
  };
  
  // Open book details modal
  const openBookDetailsModal = async (bookId) => {
    try {
      const response = await fetch(`/api/books/${bookId}`);
      
      if (response.ok) {
        const book = await response.json();
        
        // Set selected book ID
        selectedBookId = book.book_id;
        
        // Update modal content
        modalBookTitle.textContent = book.title;
        modalBookAuthor.textContent = book.author_name;
        modalBookCategory.textContent = book.category_name;
        modalBookIsbn.textContent = book.isbn || 'N/A';
        modalBookYear.textContent = book.published_year || 'N/A';
        
        // Update status and borrow button
        if (book.available) {
          modalBookStatus.textContent = 'Available';
          modalBookStatus.className = 'status-available';
          borrowBookBtn.style.display = 'block';
          dueDateSelector.classList.add('hidden');
        } else {
          modalBookStatus.textContent = 'Borrowed';
          modalBookStatus.className = 'status-borrowed';
          borrowBookBtn.style.display = 'none';
          dueDateSelector.classList.add('hidden');
        }
        
        // Show modal
        bookModal.style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading book details:', error);
      App.showToast('Failed to load book details', 'error');
    }
  };
  
  // Borrow a book
  const borrowBook = async (bookId, dueDaysValue) => {
    try {
      const response = await fetch(`/api/users/borrow/${bookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dueDays: dueDaysValue }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to borrow book');
      }
      
      // Close modal
      bookModal.style.display = 'none';
      
      // Show success message
      App.showToast('Book borrowed successfully', 'success');
      
      // Reload books
      loadAllBooks();
      
      return true;
    } catch (error) {
      console.error('Error borrowing book:', error);
      App.showToast(error.message, 'error');
      return false;
    }
  };
  
  // Return a book
  const returnBook = async (borrowId) => {
    try {
      const response = await fetch(`/api/users/return/${borrowId}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to return book');
      }
      
      // Show success message
      App.showToast('Book returned successfully', 'success');
      
      // Reload my books
      loadMyBooks();
      
      return true;
    } catch (error) {
      console.error('Error returning book:', error);
      App.showToast(error.message, 'error');
      return false;
    }
  };
  
  // Load user's borrowed books
  const loadMyBooks = async () => {
    try {
      // Make sure DOM elements are initialized
      if (!currentBooksTable) initDomElements();
      
      console.log('Loading my books');
      
      const response = await fetch('/api/users/my-books');
      
      if (response.ok) {
        const books = await response.json();
        
        // Filter books by status
        const currentBooks = books.filter(book => book.return_date === null);
        const historyBooks = books.filter(book => book.return_date !== null);
        
        // Render current books
        renderCurrentBooks(currentBooks);
        
        // Render history books
        renderHistoryBooks(historyBooks);
      }
    } catch (error) {
      console.error('Error loading my books:', error);
      App.showToast('Failed to load your books', 'error');
    }
  };
  
  // Render current borrowed books
  const renderCurrentBooks = (books) => {
    const tableBody = currentBooksTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (books.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No books currently borrowed</td></tr>';
      return;
    }
    
    books.forEach(book => {
      const row = document.createElement('tr');
      
      // Format dates
      const borrowDate = new Date(book.borrow_date).toLocaleDateString();
      const dueDate = new Date(book.due_date).toLocaleDateString();
      
      // Calculate if overdue
      const isOverdue = new Date(book.due_date) < new Date() && !book.return_date;
      
      row.innerHTML = `
        <td>${book.title}</td>
        <td>${book.author_name}</td>
        <td>${borrowDate}</td>
        <td>${dueDate}</td>
        <td>
          <span class="book-status ${isOverdue ? 'status-borrowed' : 'status-available'}">
            ${isOverdue ? 'Overdue' : 'Borrowed'}
          </span>
        </td>
        <td>
          <button class="btn btn-primary return-book-btn" data-id="${book.borrow_id}">Return</button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Add event listeners to return buttons
    const returnButtons = tableBody.querySelectorAll('.return-book-btn');
    returnButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const borrowId = e.target.dataset.id;
        await returnBook(borrowId);
      });
    });
  };
  
  // Render borrowing history
  const renderHistoryBooks = (books) => {
    const tableBody = historyBooksTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (books.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No borrowing history</td></tr>';
      return;
    }
    
    books.forEach(book => {
      const row = document.createElement('tr');
      
      // Format dates
      const borrowDate = new Date(book.borrow_date).toLocaleDateString();
      const dueDate = new Date(book.due_date).toLocaleDateString();
      const returnDate = book.return_date ? new Date(book.return_date).toLocaleDateString() : 'N/A';
      
      // Calculate if it was returned late
      const isLate = book.return_date && new Date(book.return_date) > new Date(book.due_date);
      
      row.innerHTML = `
        <td>${book.title}</td>
        <td>${book.author_name}</td>
        <td>${borrowDate}</td>
        <td>${dueDate}</td>
        <td>${returnDate}</td>
        <td>
          <span class="book-status ${isLate ? 'status-borrowed' : 'status-available'}">
            ${isLate ? 'Returned Late' : 'Returned'}
          </span>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  };
  
  // Search books by title or author
  const searchBooks = (query) => {
    loadAllBooks({ title: query });
  };
  
  // Close book modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === bookModal) {
      bookModal.style.display = 'none';
      dueDateSelector.classList.add('hidden');
    }
  });
  
  // Close book modal when clicking close button
  document.querySelector('#book-modal .close').addEventListener('click', () => {
    bookModal.style.display = 'none';
    dueDateSelector.classList.add('hidden');
  });
  
  // Initialize the module
  const init = () => {
    console.log('Initializing Books module');
    // Initialize DOM elements
    initDomElements();
    
    if (!bookModal || !borrowBookBtn || !confirmBorrowBtn || !applyFiltersBtn) {
      console.error('Books module DOM elements not found');
      return;
    }
    
    // Borrow button click handler
    borrowBookBtn.addEventListener('click', () => {
      borrowBookBtn.style.display = 'none';
      dueDateSelector.classList.remove('hidden');
    });
    
    // Confirm borrow button click handler
    confirmBorrowBtn.addEventListener('click', async () => {
      if (selectedBookId) {
        const dueDaysValue = dueDays.value;
        await borrowBook(selectedBookId, dueDaysValue);
      }
    });
    
    // Apply filters button click handler
    applyFiltersBtn.addEventListener('click', () => {
      const filters = {
        category: categoryFilter.value,
        author: authorFilter.value,
        available: availabilityFilter.value === '' ? undefined : availabilityFilter.value === 'true'
      };
      
      loadAllBooks(filters);
    });
    
    // Close book modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === bookModal) {
        bookModal.style.display = 'none';
        dueDateSelector.classList.add('hidden');
      }
    });
    
    // Close book modal when clicking close button
    const closeModalBtn = document.querySelector('#book-modal .close');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        bookModal.style.display = 'none';
        dueDateSelector.classList.add('hidden');
      });
    }
  };
  
  // Return public API
  return {
    init,
    loadAllBooks,
    loadMyBooks,
    searchBooks
  };
})();

// Initialize books module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready for Books module');
  Books.init();
}); 