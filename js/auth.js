/**
 * Quản lý trạng thái xác thực người dùng
 * Sử dụng localStorage để lưu trữ thông tin người dùng hiện tại
 */
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

/**
 * Các hàm xử lý xác thực
 */

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {Object|null} Thông tin người dùng hoặc null nếu chưa đăng nhập
 */
function getCurrentUser() {
    return currentUser;
}

/**
 * Kiểm tra trạng thái đăng nhập
 * @returns {boolean} true nếu đã đăng nhập, false nếu chưa
 */
function isLoggedIn() {
    return currentUser !== null;
}

/**
 * Xử lý đăng nhập
 * @param {string} email - Email người dùng
 * @param {string} password - Mật khẩu
 * @returns {boolean} true nếu đăng nhập thành công, false nếu thất bại
 */
function login(email, password) {
    // Trong ứng dụng thực tế, đây sẽ là một API call
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUIForLoggedInUser();
        return true;
    }
    return false;
}

/**
 * Xử lý đăng ký tài khoản mới
 * @param {string} email - Email người dùng
 * @param {string} password - Mật khẩu
 * @param {string} name - Tên người dùng
 * @returns {boolean} true nếu đăng ký thành công, false nếu email đã tồn tại
 */
function register(email, password, name) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Kiểm tra email đã tồn tại chưa
    if (users.some(u => u.email === email)) {
        return false;
    }
    
    // Tạo user mới với các thông tin cơ bản
    const newUser = {
        id: Date.now(),
        email,
        password,
        name,
        wishlist: [], // Danh sách sản phẩm yêu thích
        orders: []    // Lịch sử đơn hàng
    };
    
    // Lưu user mới vào danh sách
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Cập nhật user hiện tại và UI
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    updateUIForLoggedInUser();
    return true;
}

/**
 * Xử lý đăng xuất
 * Xóa thông tin user hiện tại và cập nhật UI
 */
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUIForLoggedOutUser();
}

/**
 * Cập nhật giao diện khi người dùng đã đăng nhập
 * Thay thế icon user bằng tên người dùng và nút đăng xuất
 */
function updateUIForLoggedInUser() {
    const btnUser = document.getElementById('btn-user');
    const navActions = document.querySelector('.nav-actions');
    
    // Tạo text chào mừng
    const welcomeText = document.createElement('span');
    welcomeText.id = 'login-text';
    welcomeText.textContent = `Xin chào, ${currentUser.name}`;
    
    // Tạo nút đăng xuất
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'btn-logout';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Đăng xuất';
    logoutBtn.onclick = logout;
    
    // Cập nhật UI
    btnUser.style.display = 'none';
    navActions.insertBefore(welcomeText, navActions.firstChild);
    navActions.insertBefore(logoutBtn, welcomeText.nextSibling);
}

/**
 * Cập nhật giao diện khi người dùng đăng xuất
 * Khôi phục lại icon user
 */
function updateUIForLoggedOutUser() {
    const btnUser = document.getElementById('btn-user');
    const navActions = document.querySelector('.nav-actions');
    const welcomeText = document.getElementById('login-text');
    const logoutBtn = document.getElementById('btn-logout');
    
    // Xóa các phần tử UI của trạng thái đăng nhập
    if (welcomeText) welcomeText.remove();
    if (logoutBtn) logoutBtn.remove();
    
    // Hiện lại icon user
    btnUser.style.display = 'block';
}

// Export các hàm xác thực để sử dụng ở các file khác
window.auth = {
    getCurrentUser,
    isLoggedIn,
    login,
    register,
    logout
};

/**
 * Khởi tạo các sự kiện xử lý đăng nhập/đăng ký
 * Chạy khi trang web được load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Lấy các phần tử DOM cần thiết
    const btnUser = document.getElementById('btn-user');
    const popupLoginOverlay = document.getElementById('popup-login-overlay');
    const closeLogin = document.getElementById('close-login');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Kiểm tra và cập nhật UI theo trạng thái đăng nhập
    if (isLoggedIn()) {
        updateUIForLoggedInUser();
    }

    // Xử lý sự kiện click vào nút user
    btnUser.addEventListener('click', function() {
        popupLoginOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Ngăn scroll khi popup mở
    });

    // Xử lý đóng popup
    closeLogin.addEventListener('click', function() {
        popupLoginOverlay.style.display = 'none';
        document.body.style.overflow = ''; // Cho phép scroll lại
    });

    // Chuyển đổi giữa form đăng nhập và đăng ký
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Xử lý submit form đăng nhập
    const loginFormElement = loginForm.querySelector('form');
    loginFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = this.querySelector('input[type="password"]').value;

        if (login(email, password)) {
            popupLoginOverlay.style.display = 'none';
            document.body.style.overflow = '';
        } else {
            alert('Email hoặc mật khẩu không đúng!');
        }
    });

    // Xử lý submit form đăng ký
    const registerFormElement = registerForm.querySelector('form');
    registerFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelectorAll('input[type="password"]')[0].value;
        const confirmPassword = this.querySelectorAll('input[type="password"]')[1].value;

        // Kiểm tra mật khẩu nhập lại
        if (password !== confirmPassword) {
            alert('Mật khẩu không khớp!');
            return;
        }

        if (register(email, password, name)) {
            popupLoginOverlay.style.display = 'none';
            document.body.style.overflow = '';
        } else {
            alert('Email đã tồn tại!');
        }
    });

    // Đóng popup khi click bên ngoài
    popupLoginOverlay.addEventListener('click', function(e) {
        if (e.target === popupLoginOverlay) {
            popupLoginOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
}); 