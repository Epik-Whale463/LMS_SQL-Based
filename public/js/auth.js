// Auth Module
const Auth = (() => {
  // DOM Elements
  const authContainer = document.getElementById('auth-container');
  const mainContainer = document.getElementById('main-container');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabBtns = document.querySelectorAll('.auth-box .tab-btn');
  const tabContents = document.querySelectorAll('.auth-box .tab-content');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  const logoutBtn = document.getElementById('logout-btn');
  
  // Switch tabs in the auth box
  const switchTab = (tabId) => {
    tabBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      }
    });
    
    tabContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === `${tabId}-tab`) {
        content.classList.add('active');
      }
    });
  };
  
  // Show error message
  const showError = (element, message) => {
    element.textContent = message;
    element.style.display = 'block';
    
    // Clear error after 5 seconds
    setTimeout(() => {
      element.textContent = '';
      element.style.display = 'none';
    }, 5000);
  };
  
  // Login handler
  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store user data in session storage
      sessionStorage.setItem('user', JSON.stringify(data));
      
      // Update UI based on user role
      if (data.role === 'admin') {
        document.body.classList.add('is-admin');
      }
      
      // Switch to main container
      authContainer.classList.add('hidden');
      mainContainer.classList.remove('hidden');
      
      // Update user info in header
      document.getElementById('user-name').textContent = data.fullName || data.username;
      document.getElementById('user-role').textContent = data.role === 'admin' ? 'Admin' : 'Member';
      
      // Update profile page
      updateProfilePage(data);
      
      // Load dashboard data
      App.loadDashboard();
      
      return data;
    } catch (error) {
      showError(loginError, error.message);
      return null;
    }
  };
  
  // Register handler
  const register = async (username, email, password, fullName) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          fullName,
          role: 'member' // Default role for new registrations
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Switch to login tab after successful registration
      switchTab('login');
      
      // Show success message
      App.showToast('Registration successful. Please login.', 'success');
      
      return data;
    } catch (error) {
      showError(registerError, error.message);
      return null;
    }
  };
  
  // Logout handler
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Clear session storage
      sessionStorage.removeItem('user');
      
      // Reset admin status
      document.body.classList.remove('is-admin');
      
      // Switch to auth container
      mainContainer.classList.add('hidden');
      authContainer.classList.remove('hidden');
      
      // Reset forms
      loginForm.reset();
      registerForm.reset();
      
      // Switch to login tab
      switchTab('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Check if user is logged in
  const checkAuth = async () => {
    try {
      // First check session storage
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // Verify with backend
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          // User is authenticated
          if (userData.role === 'admin') {
            document.body.classList.add('is-admin');
          }
          
          // Update UI
          document.getElementById('user-name').textContent = userData.fullName || userData.username;
          document.getElementById('user-role').textContent = userData.role === 'admin' ? 'Admin' : 'Member';
          
          // Update profile page
          updateProfilePage(userData);
          
          // Show main container
          authContainer.classList.add('hidden');
          mainContainer.classList.remove('hidden');
          
          // Load dashboard data
          App.loadDashboard();
          
          return userData;
        } else {
          // Session expired
          sessionStorage.removeItem('user');
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      return null;
    }
  };
  
  // Update profile page with user data
  const updateProfilePage = (userData) => {
    document.getElementById('profile-name').textContent = userData.fullName || userData.username;
    document.getElementById('profile-role').textContent = userData.role === 'admin' ? 'Admin' : 'Member';
    document.getElementById('profile-username').textContent = userData.username;
    document.getElementById('profile-email').textContent = userData.email || 'N/A';
    
    // Load more profile data if needed
    loadProfileStats(userData.id);
  };
  
  // Load profile statistics
  const loadProfileStats = async (userId) => {
    try {
      const response = await fetch('/api/users/profile');
      
      if (response.ok) {
        const data = await response.json();
        
        document.getElementById('profile-total-borrowed').textContent = data.stats.total_borrowed || 0;
        document.getElementById('profile-currently-borrowed').textContent = data.stats.currently_borrowed || 0;
        document.getElementById('profile-overdue').textContent = data.stats.overdue || 0;
        
        if (data.registration_date) {
          const joinDate = new Date(data.registration_date);
          document.getElementById('profile-joined').textContent = joinDate.toLocaleDateString();
        }
      }
    } catch (error) {
      console.error('Error loading profile stats:', error);
    }
  };
  
  // Initialize auth module
  const init = () => {
    // Tab switching
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        switchTab(tabId);
      });
    });
    
    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      
      await login(username, password);
    });
    
    // Register form submission
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const fullName = document.getElementById('register-fullname').value;
      const password = document.getElementById('register-password').value;
      
      await register(username, email, password, fullName);
    });
    
    // Logout button
    logoutBtn.addEventListener('click', logout);
    
    // Check if user is already logged in
    checkAuth();
  };
  
  // Return public API
  return {
    init,
    login,
    logout,
    register,
    checkAuth,
    switchTab
  };
})();

// Initialize auth module when DOM is loaded
document.addEventListener('DOMContentLoaded', Auth.init); 