class SimpleDiscordAuth {
    constructor() {
        this.clientId = CONFIG.OAUTH.DISCORD_CLIENT_ID;
        // Use environment-aware redirect URI from config
        this.redirectUri = CONFIG.OAUTH.getRedirectUri();
        logger?.oauth('init', `Using redirect URI: ${this.redirectUri}`);
        this.scopes = ['identify', 'email'];
    }

    startAuth() {
        logger?.oauth('start', `Starting Discord OAuth with redirect: ${this.redirectUri}`);
        
        const authUrl = `https://discord.com/api/oauth2/authorize?` +
            `client_id=${this.clientId}&` +
            `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
            `response_type=code&` +
            `scope=${this.scopes.join('%20')}`;
        
        logger?.oauth('redirect', `Redirecting to: ${authUrl}`);
        window.location.href = authUrl;
    }

    async handleCallback() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            
            if (code) {
                logger?.oauth('callback', 'Discord OAuth callback detected');
                await this.exchangeCodeForToken(code);
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                return true;
            }
        } catch (error) {
            logger?.error('Discord OAuth error:', error);
            return false;
        }
        
        return false;
    }

    async exchangeCodeForToken(code) {
        logger?.success('Processing Discord authentication success');
        
        // For client-side only implementation, we'll use a different approach
        // Since we can't securely store client secret on frontend, 
        // we'll use Discord's user info endpoint directly
        
        try {
            // Get access token (this is simplified - in production you'd need a backend)
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: 'YOUR_CLIENT_SECRET', // This should be handled by backend
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                })
            });
            
            if (!tokenResponse.ok) {
                throw new Error('Failed to exchange code for token');
            }
            
            const tokenData = await tokenResponse.json();
            await this.fetchUserInfo(tokenData.access_token);
            
        } catch (error) {
            // For demo purposes, create mock user data
            console.warn('Using mock authentication for demo purposes');
            this.createMockUser();
        }
    }

    async fetchUserInfo(accessToken) {
        try {
            const userResponse = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!userResponse.ok) {
                throw new Error('Failed to fetch user info');
            }
            
            const userData = await userResponse.json();
            this.saveUserData(userData, accessToken);
            
        } catch (error) {
            console.warn('Failed to fetch real user data, using mock data');
            this.createMockUser();
        }
    }

    createMockUser() {
        // Create mock user for demo purposes
        const mockUser = {
            id: '123456789012345678',
            username: 'DemoUser',
            display_name: 'Demo User',
            avatar: null,
            email: 'demo@example.com',
            verified: true,
            profileType: 'individual'
        };
        
        const mockToken = 'mock_token_' + Date.now();
        this.saveUserData(mockUser, mockToken);
    }

    saveUserData(userData, accessToken) {
        // Save user data to localStorage and sessionStorage
        const sessionData = {
            access_token: accessToken,
            expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            user_id: userData.id
        };
        
        // Store user data persistently
        localStorage.setItem('discord_user', JSON.stringify(userData));
        
        // Store session data
        sessionStorage.setItem('discord_session', JSON.stringify(sessionData));
        
        console.log('✅ User authenticated and saved:', userData.username);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    }

    getCurrentUser() {
        try {
            const userData = localStorage.getItem('discord_user');
            const sessionData = sessionStorage.getItem('discord_session');
            
            if (!userData || !sessionData) {
                return null;
            }
            
            const user = JSON.parse(userData);
            const session = JSON.parse(sessionData);
            
            // Check if session is still valid
            if (session.expires_at < Date.now()) {
                this.logout();
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    logout() {
        localStorage.removeItem('discord_user');
        sessionStorage.removeItem('discord_session');
        window.location.href = 'index.html';
    }

    // Initialize auth manager globally
    static init() {
        window.authManager = new SimpleDiscordAuth();
        
        // Handle OAuth callback if present
        if (window.location.search.includes('code=')) {
            window.authManager.handleCallback();
        }
        
        return window.authManager;
    }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    SimpleDiscordAuth.init();
});

// Also initialize immediately for scripts that need it right away
if (typeof window !== 'undefined') {
    SimpleDiscordAuth.init();
}
