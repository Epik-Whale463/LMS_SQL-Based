// Main App Module
const App = (() => {
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const menuItems = document.querySelectorAll('.menu-item');
  const pages = document.querySelectorAll('.page');
  const logoutBtn = document.getElementById('logout-btn');
  const dashboardStats = {
    totalBooks: document.getElementById('total-books'),
    availableBooks: document.getElementById('available-books'),
    borrowedBooks: document.getElementById('borrowed-books'),
    overdueBooks: document.getElementById('overdue-books')
  };
  
  // Init function - called when app starts
  const init = () => {
    if (Auth.isLoggedIn()) {
      showMainContainer();
      setupEventListeners();
      loadDashboardStats();
      updateUserInfo();
      
      // Load initial data based on active page
      const activePage = document.querySelector('.page.active');
      if (activePage) {
        const pageId = activePage.id;
        
        if (pageId === 'dashboard-page') {
          loadDashboardData();
        } else if (pageId === 'books-page') {
          Books.loadAllBooks();
        } else if (pageId === 'my-books-page') {
          Books.loadMyBooks();
        } else if (pageId === 'admin-page') {
          Admin.init();
        } else if (pageId === 'profile-page') {
          Profile.loadUserProfile();
        }
      }
    } else {
      showAuthContainer();
    }
  };
  
  // Setup event listeners
  const setupEventListeners = () => {
    // Menu item click
    menuItems.forEach(item => {
      item.addEventListener('click', function() {
        if (this.id === 'logout-btn') return;
        
        // Remove active class from all menu items
        menuItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to clicked menu item
        this.classList.add('active');
        
        // Show corresponding page
        const pageId = this.dataset.page + '-page';
        switchPage(pageId);
      });
    });
    
    // Logout button click
    logoutBtn.addEventListener('click', Auth.logout);
    
    // Search input
    if (searchInput) {
      searchInput.addEventListener('keyup', debounce(function(e) {
        // Only search if user is on books page
        const activePage = document.querySelector('.page.active');
        if (activePage && activePage.id === 'books-page') {
          const query = e.target.value.trim();
          
          // Only search if query is 3 characters or more, or if field is cleared
          if (query.length >= 3 || query.length === 0) {
            Books.searchBooks(query);
          }
        }
      }, 500));
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
      }
    });
    
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // Get parent tabs container
        const tabsContainer = this.closest('.tabs');
        if (!tabsContainer) return;
        
        // Get related content container
        let contentContainer = tabsContainer.nextElementSibling;
        while (contentContainer && !contentContainer.classList.contains('tab-content')) {
          contentContainer = contentContainer.nextElementSibling;
        }
        
        if (!contentContainer) return;
        
        // Deactivate all tabs in this group
        tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Hide all tab contents in this group
        const tabContents = contentContainer.parentElement.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
          content.classList.remove('active');
        });
        
        // Activate selected tab and content
        this.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
      });
    });
  };
  
  // Debounce function for search
  const debounce = (func, delay) => {
    let debounceTimer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };
  
  // Switch page
  const switchPage = (pageId) => {
    console.log('Switching to page:', pageId);
    
    // Hide all pages
    pages.forEach(page => {
      page.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
      selectedPage.classList.add('active');
      console.log('Page found and activated:', pageId);
      
      // Load page-specific data
      if (pageId === 'dashboard-page') {
        loadDashboardData();
      } else if (pageId === 'books-page' && typeof Books !== 'undefined') {
        console.log('Loading books page, Books module:', Books);
        Books.loadAllBooks();
      } else if (pageId === 'my-books-page' && typeof Books !== 'undefined') {
        console.log('Loading my books page, Books module:', Books);
        Books.loadMyBooks();
      } else if (pageId === 'admin-page' && typeof Admin !== 'undefined') {
        console.log('Loading admin page');
        Admin.init();
      } else if (pageId === 'profile-page' && typeof Profile !== 'undefined') {
        console.log('Loading profile page, Profile module:', Profile);
        Profile.loadUserProfile();
      }
      
      // Reset search input when changing pages
      if (searchInput) {
        searchInput.value = '';
      }
    } else {
      console.error('Page not found:', pageId);
    }
  };
  
  // Load dashboard data
  const loadDashboardData = () => {
    loadDashboardStats();
    loadRecentBooks();
    loadTopBooks();
  };
  
  // Load dashboard stats
  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/books/stats');
      
      if (response.ok) {
        const stats = await response.json();
        
        dashboardStats.totalBooks.textContent = stats.totalBooks || 0;
        dashboardStats.availableBooks.textContent = stats.availableBooks || 0;
        dashboardStats.borrowedBooks.textContent = stats.borrowedBooks || 0;
        dashboardStats.overdueBooks.textContent = stats.overdueBooks || 0;
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };
  
  // Load recent books for dashboard
  const loadRecentBooks = async () => {
    try {
      const response = await fetch('/api/books?sort=newest&limit=5');
      
      if (response.ok) {
        const books = await response.json();
        const recentBooksTable = document.getElementById('recent-books-table').querySelector('tbody');
        
        // Clear table body
        recentBooksTable.innerHTML = '';
        
        if (books.length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = '<td colspan="4">No books found</td>';
          recentBooksTable.appendChild(row);
          return;
        }
        
        // Add rows for each book
        books.forEach(book => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author_name}</td>
            <td>${book.category_name}</td>
            <td>
              <span class="book-status ${book.available ? 'status-available' : 'status-borrowed'}">
                ${book.available ? 'Available' : 'Borrowed'}
              </span>
            </td>
          `;
          
          recentBooksTable.appendChild(row);
        });
      }
    } catch (error) {
      console.error('Error loading recent books:', error);
    }
  };
  
  // Load top borrowed books for dashboard
  const loadTopBooks = async () => {
    try {
      const response = await fetch('/api/books/stats/top-borrowed?limit=5');
      
      if (response.ok) {
        const books = await response.json();
        const topBooksChart = document.getElementById('top-books-chart');
        
        // If no data or chart container not found
        if (books.length === 0 || !topBooksChart) {
          if (topBooksChart) {
            topBooksChart.innerHTML = '<p>No borrowing data available</p>';
          }
          return;
        }
        
        // Create simple chart using div bars
        let chartHTML = '<div class="chart-container">';
        
        books.forEach((book, index) => {
          const percentage = (book.borrow_count / books[0].borrow_count) * 100;
          
          chartHTML += `
            <div class="chart-item">
              <div class="chart-label">${book.title}</div>
              <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${percentage}%;" title="${book.borrow_count} borrows"></div>
                <span class="chart-value">${book.borrow_count}</span>
              </div>
            </div>
          `;
        });
        
        chartHTML += '</div>';
        topBooksChart.innerHTML = chartHTML;
      }
    } catch (error) {
      console.error('Error loading top books:', error);
    }
  };
  
  // Update user info in header
  const updateUserInfo = () => {
    const userData = Auth.getUserData();
    
    if (userData) {
      const userNameElement = document.getElementById('user-name');
      const userRoleElement = document.getElementById('user-role');
      
      if (userNameElement) {
        userNameElement.textContent = userData.full_name || userData.username;
      }
      
      if (userRoleElement) {
        userRoleElement.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
      }
      
      // Set admin specific styling if user is admin
      if (userData.role === 'admin') {
        document.body.classList.add('is-admin');
      } else {
        document.body.classList.remove('is-admin');
      }
    }
  };
  
  // Show auth container (login/register)
  const showAuthContainer = () => {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('main-container').classList.add('hidden');
  };
  
  // Show main container (app)
  const showMainContainer = () => {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('main-container').classList.remove('hidden');
  };
  
  // Show toast message
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle"></i>';
        break;
      case 'error':
        icon = '<i class="fas fa-times-circle"></i>';
        break;
      case 'warning':
        icon = '<i class="fas fa-exclamation-circle"></i>';
        break;
      default:
        icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.innerHTML = `
      <div class="toast-content">
        ${icon}
        <span>${message}</span>
      </div>
      <div class="toast-progress"></div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Remove toast after animation
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };
  
  return {
    init,
    showToast,
    switchPage
  };
})();

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  App.init();
}); 