// Authentication state management
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Auth functions
function getCurrentUser() {
    return currentUser;
}

function isLoggedIn() {
    return currentUser !== null;
}

function login(email, password) {
    // In a real app, this would make an API call
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

function register(email, password, name) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.email === email)) {
        return false;
    }
    
    const newUser = {
        id: Date.now(),
        email,
        password,
        name,
        wishlist: [],
        orders: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return true;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
}

// Export functions
window.auth = {
    getCurrentUser,
    isLoggedIn,
    login,
    register,
    logout
}; 