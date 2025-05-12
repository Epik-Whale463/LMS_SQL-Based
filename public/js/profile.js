// Profile Module
const Profile = (() => {
  // DOM Elements
  let profileName, profileRole, profileUsername, profileEmail, profileJoined,
      profileTotalBorrowed, profileCurrentlyBorrowed, profileOverdue;

  // Initialize DOM elements
  const initDomElements = () => {
    console.log('Initializing Profile DOM elements');
    profileName = document.getElementById('profile-name');
    profileRole = document.getElementById('profile-role');
    profileUsername = document.getElementById('profile-username');
    profileEmail = document.getElementById('profile-email');
    profileJoined = document.getElementById('profile-joined');
    profileTotalBorrowed = document.getElementById('profile-total-borrowed');
    profileCurrentlyBorrowed = document.getElementById('profile-currently-borrowed');
    profileOverdue = document.getElementById('profile-overdue');

    // Log elements for debugging
    console.log('Profile DOM elements:', { 
      profileName, profileRole, profileUsername, profileEmail 
    });
  };

  // Load user profile
  const loadUserProfile = async () => {
    try {
      // Make sure DOM elements are initialized
      if (!profileName) initDomElements();
      
      console.log('Loading user profile');
      
      const response = await fetch('/api/users/profile');
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Profile data received:', userData);
        
        // Update profile info
        if (profileName) profileName.textContent = userData.full_name || userData.username;
        if (profileRole) profileRole.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
        if (profileUsername) profileUsername.textContent = userData.username;
        if (profileEmail) profileEmail.textContent = userData.email || 'N/A';
        
        // Format and display join date
        if (userData.registration_date && profileJoined) {
          const joinDate = new Date(userData.registration_date);
          profileJoined.textContent = joinDate.toLocaleDateString();
        }
        
        // Update stats
        if (profileTotalBorrowed) profileTotalBorrowed.textContent = userData.stats.total_borrowed || 0;
        if (profileCurrentlyBorrowed) profileCurrentlyBorrowed.textContent = userData.stats.currently_borrowed || 0;
        if (profileOverdue) profileOverdue.textContent = userData.stats.overdue || 0;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (window.App && App.showToast) {
        App.showToast('Failed to load profile data', 'error');
      }
    }
  };

  // Initialize the module
  const init = () => {
    console.log('Initializing Profile module');
    initDomElements();
  };

  // Return public API
  return {
    init,
    loadUserProfile
  };
})();

// Initialize profile module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready for Profile module');
  Profile.init();
}); 