// Authentication system for GuildCertified
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authState = 'logged-out'; // logged-out, logged-in, setup-required
        this.init();
    }

    init() {
        this.initializeProviders();
        this.bindEvents();
        this.checkExistingAuth();
    }

    initializeProviders() {
        // Initialize Google OAuth
        this.initGoogleAuth();
        
        // Initialize Facebook SDK
        this.initFacebookAuth();
        
        // Discord and GitHub will use OAuth redirect flow
    }

    initGoogleAuth() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: CONFIG.OAUTH.GOOGLE_CLIENT_ID || 'your-google-client-id',
                callback: (response) => this.handleGoogleLogin(response)
            });
        }
    }

    initFacebookAuth() {
        if (typeof FB !== 'undefined') {
            FB.init({
                appId: CONFIG.OAUTH.FACEBOOK_APP_ID || 'your-facebook-app-id',
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
        }
    }

    bindEvents() {
        // Login button
        document.getElementById('login-btn')?.addEventListener('click', () => {
            this.showLoginModal();
        });

        // OAuth provider buttons
        document.getElementById('google-login')?.addEventListener('click', () => {
            this.loginWithGoogle();
        });

        document.getElementById('facebook-login')?.addEventListener('click', () => {
            this.loginWithFacebook();
        });

        document.getElementById('discord-login')?.addEventListener('click', () => {
            this.loginWithDiscord();
        });

        document.getElementById('github-login')?.addEventListener('click', () => {
            this.loginWithGitHub();
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    showLoginModal() {
        document.getElementById('login-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideLoginModal() {
        document.getElementById('login-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async loginWithGoogle() {
        try {
            if (typeof google !== 'undefined' && google.accounts) {
                google.accounts.id.prompt();
            } else {
                // Fallback to mock login for development
                this.mockLogin('google', {
                    name: 'John Doe',
                    email: 'john@example.com',
                    picture: 'https://via.placeholder.com/100x100?text=JD'
                });
            }
        } catch (error) {
            console.error('Google login failed:', error);
            this.showError('Google login failed. Please try again.');
        }
    }

    async loginWithFacebook() {
        try {
            if (typeof FB !== 'undefined') {
                FB.login((response) => {
                    if (response.authResponse) {
                        FB.api('/me', { fields: 'name,email,picture' }, (userInfo) => {
                            this.handleOAuthSuccess('facebook', userInfo);
                        });
                    }
                }, { scope: 'email' });
            } else {
                // Fallback to mock login for development
                this.mockLogin('facebook', {
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    picture: 'https://via.placeholder.com/100x100?text=JS'
                });
            }
        } catch (error) {
            console.error('Facebook login failed:', error);
            this.showError('Facebook login failed. Please try again.');
        }
    }

    async loginWithDiscord() {
        // For Discord OAuth, we would redirect to Discord's OAuth URL
        // For development, we'll use mock login
        this.mockLogin('discord', {
            name: 'DiscordUser#1234',
            email: 'discord@example.com',
            picture: 'https://via.placeholder.com/100x100?text=DU'
        });
    }

    async loginWithGitHub() {
        // For GitHub OAuth, we would redirect to GitHub's OAuth URL
        // For development, we'll use mock login
        this.mockLogin('github', {
            name: 'GitHubDev',
            email: 'dev@github.com',
            picture: 'https://via.placeholder.com/100x100?text=GD'
        });
    }

    // Mock login for development purposes
    mockLogin(provider, userData) {
        console.log(`Mock login with ${provider}:`, userData);
        this.handleOAuthSuccess(provider, userData);
    }

    handleGoogleLogin(response) {
        // Decode the JWT token
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        const userData = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        };
        this.handleOAuthSuccess('google', userData);
    }

    async handleOAuthSuccess(provider, userData) {
        try {
            this.hideLoginModal();
            
            // Check if user exists in our system
            const existingUser = await this.checkUserExists(userData.email);
            
            if (existingUser) {
                // User exists, log them in
                this.currentUser = existingUser;
                this.authState = 'logged-in';
                await this.updateUserLastLogin();
            } else {
                // New user, show profile setup
                this.currentUser = {
                    id: this.generateUserId(),
                    email: userData.email,
                    name: userData.name,
                    avatar: userData.picture,
                    provider: provider,
                    created_at: new Date().toISOString(),
                    profile_completed: false
                };
                this.authState = 'setup-required';
                this.showProfileSetup();
            }
            
            this.updateUI();
            this.saveAuthState();
            
        } catch (error) {
            console.error('Login handling failed:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    async checkUserExists(email) {
        try {
            // This would normally check against your backend/database
            // For now, we'll check localStorage for demo purposes
            const users = JSON.parse(localStorage.getItem('gc_users') || '[]');
            return users.find(user => user.email === email);
        } catch (error) {
            console.error('Error checking user existence:', error);
            return null;
        }
    }

    init() {
        this.initializeProviders();
        this.bindEvents();
        this.checkExistingAuth();
    }

    initializeProviders() {
        // Initialize Google OAuth
        this.initGoogleAuth();
        
        // Initialize Facebook SDK
        this.initFacebookAuth();
        
        // Discord and GitHub will use OAuth redirect flow
    }

    initGoogleAuth() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: CONFIG.OAUTH.GOOGLE_CLIENT_ID || 'your-google-client-id',
                callback: (response) => this.handleGoogleLogin(response)
            });
        }
    }

    initFacebookAuth() {
        if (typeof FB !== 'undefined') {
            FB.init({
                appId: CONFIG.OAUTH.FACEBOOK_APP_ID || 'your-facebook-app-id',
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
        }
    }

    bindEvents() {
        // Login button
        document.getElementById('login-btn')?.addEventListener('click', () => {
            this.showLoginModal();
        });

        // OAuth provider buttons
        document.getElementById('google-login')?.addEventListener('click', () => {
            this.loginWithGoogle();
        });

        document.getElementById('facebook-login')?.addEventListener('click', () => {
            this.loginWithFacebook();
        });

        document.getElementById('discord-login')?.addEventListener('click', () => {
            this.loginWithDiscord();
        });

        document.getElementById('github-login')?.addEventListener('click', () => {
            this.loginWithGitHub();
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    showLoginModal() {
        document.getElementById('login-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideLoginModal() {
        document.getElementById('login-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async loginWithGoogle() {
        try {
            if (typeof google !== 'undefined' && google.accounts) {
                google.accounts.id.prompt();
            } else {
                // Fallback to mock login for development
                this.mockLogin('google', {
                    name: 'John Doe',
                    email: 'john@example.com',
                    picture: 'https://via.placeholder.com/100x100?text=JD'
                });
            }
        } catch (error) {
            console.error('Google login failed:', error);
            this.showError('Google login failed. Please try again.');
        }
    }

    async loginWithFacebook() {
        try {
            if (typeof FB !== 'undefined') {
                FB.login((response) => {
                    if (response.authResponse) {
                        FB.api('/me', { fields: 'name,email,picture' }, (userInfo) => {
                            this.handleOAuthSuccess('facebook', userInfo);
                        });
                    }
                }, { scope: 'email' });
            } else {
                // Fallback to mock login for development
                this.mockLogin('facebook', {
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    picture: 'https://via.placeholder.com/100x100?text=JS'
                });
            }
        } catch (error) {
            console.error('Facebook login failed:', error);
            this.showError('Facebook login failed. Please try again.');
        }
    }

    async loginWithDiscord() {
        // For Discord OAuth, we would redirect to Discord's OAuth URL
        // For development, we'll use mock login
        this.mockLogin('discord', {
            name: 'DiscordUser#1234',
            email: 'discord@example.com',
            picture: 'https://via.placeholder.com/100x100?text=DU'
        });
    }

    async loginWithGitHub() {
        // For GitHub OAuth, we would redirect to GitHub's OAuth URL
        // For development, we'll use mock login
        this.mockLogin('github', {
            name: 'GitHubDev',
            email: 'dev@github.com',
            picture: 'https://via.placeholder.com/100x100?text=GD'
        });
    }

    // Mock login for development purposes
    mockLogin(provider, userData) {
        console.log(`Mock login with ${provider}:`, userData);
        this.handleOAuthSuccess(provider, userData);
    }

    handleGoogleLogin(response) {
        // Decode the JWT token
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        const userData = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        };
        this.handleOAuthSuccess('google', userData);
    }

    async handleOAuthSuccess(provider, userData) {
        try {
            this.hideLoginModal();
            
            // Check if user exists in our system
            const existingUser = await this.checkUserExists(userData.email);
            
            if (existingUser) {
                // User exists, log them in
                this.currentUser = existingUser;
                this.authState = 'logged-in';
                await this.updateUserLastLogin();
            } else {
                // New user, show profile setup
                this.currentUser = {
                    id: this.generateUserId(),
                    email: userData.email,
                    name: userData.name,
                    avatar: userData.picture,
                    provider: provider,
                    created_at: new Date().toISOString(),
                    profile_completed: false
                };
                this.authState = 'setup-required';
                this.showProfileSetup();
            }
            
            this.updateUI();
            this.saveAuthState();
            
        } catch (error) {
            console.error('Login handling failed:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    async checkUserExists(email) {
        try {
            // This would normally check against your backend/database
            // For now, we'll check localStorage for demo purposes
            const users = JSON.parse(localStorage.getItem('rms_users') || '[]');
            return users.find(user => user.email === email);
        } catch (error) {
            console.error('Error checking user:', error);
            return null;
        }
    }

    async updateUserLastLogin() {
        this.currentUser.last_login = new Date().toISOString();
        await this.saveUserData();
    }

    async saveUserData() {
        try {
            // In a real app, this would save to your backend
            // For demo, we'll use localStorage
            const users = JSON.parse(localStorage.getItem('rms_users') || '[]');
            const existingIndex = users.findIndex(u => u.id === this.currentUser.id);
            
            if (existingIndex >= 0) {
                users[existingIndex] = this.currentUser;
            } else {
                users.push(this.currentUser);
            }
            
            localStorage.setItem('gc_users', JSON.stringify(users));
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    showProfileSetup() {
        if (window.profileSetup) {
            window.profileSetup.show(this.currentUser);
        }
    }

    updateUI() {
        const loggedOutNav = document.getElementById('nav-auth-logged-out');
        const loggedInNav = document.getElementById('nav-auth-logged-in');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');

        if (this.authState === 'logged-in') {
            loggedOutNav.style.display = 'none';
            loggedInNav.style.display = 'flex';
            
            if (userAvatar && this.currentUser.avatar) {
                userAvatar.src = this.currentUser.avatar;
            }
            
            if (userName) {
                userName.textContent = this.currentUser.name || 'User';
            }
            
            // Show dashboard if they're on that page
            if (window.location.hash === '#dashboard' || this.shouldShowDashboard()) {
                this.showDashboard();
            }
        } else {
            loggedOutNav.style.display = 'block';
            loggedInNav.style.display = 'none';
        }
    }

    shouldShowDashboard() {
        return this.authState === 'logged-in' && this.currentUser?.profile_completed;
    }

    showDashboard() {
        if (window.dashboard) {
            window.dashboard.show();
        }
    }

    logout() {
        this.currentUser = null;
        this.authState = 'logged-out';
        localStorage.removeItem('gc_auth_state');
        
        // Clear provider-specific sessions
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        
        if (typeof FB !== 'undefined') {
            FB.logout();
        }
        
        this.updateUI();
        
        // Redirect to home
        window.location.hash = '#home';
        
        this.showSuccess('You have been logged out successfully.');
    }

    saveAuthState() {
        const authData = {
            user: this.currentUser,
            state: this.authState,
            timestamp: Date.now()
        };
        localStorage.setItem('gc_auth_state', JSON.stringify(authData));
    }

    checkExistingAuth() {
        try {
            const authData = JSON.parse(localStorage.getItem('gc_auth_state') || '{}');
            
            if (authData.user && authData.timestamp) {
                // Check if auth is still valid (24 hours)
                const isValid = Date.now() - authData.timestamp < 24 * 60 * 60 * 1000;
                
                if (isValid) {
                    this.currentUser = authData.user;
                    this.authState = authData.state;
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Error checking existing auth:', error);
        }
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    isLoggedIn() {
        return this.authState === 'logged-in';
    }

    requireAuth(callback) {
        if (this.isLoggedIn()) {
            callback();
        } else {
            this.showLoginModal();
        }
    }

    showSuccess(message) {
        // You could implement a toast notification system here
        console.log('Success:', message);
    }

    showError(message) {
        // You could implement a toast notification system here
        console.error('Error:', message);
        alert(message);
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    window.auth = window.authManager; // Keep both for compatibility
});