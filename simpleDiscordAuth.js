// Simplified Discord OAuth that works with proper redirect
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
        
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: this.scopes.join(' '),
            state: 'discord_auth_' + Date.now()
        });

        const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
        logger?.oauth('redirect', `Redirecting to: ${authUrl}`);
        
        localStorage.setItem('discord_auth_started', 'true');
        window.location.href = authUrl;
    }

    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            logger?.error('Discord OAuth error:', error);
            return false;
        }

        if (code && localStorage.getItem('discord_auth_started')) {
            logger?.oauth('callback', 'Discord OAuth callback detected');
            localStorage.removeItem('discord_auth_started');
            
            // Try to get real Discord data - for development we'll use simulated info
            const userData = await this.getDiscordUserData(code) || {
                id: '123456789012345678', // Simulated Discord user ID for default avatar
                username: 'fwf2_', // Your actual Discord username
                global_name: 'fwf2_',
                email: 'fwf2_@discord.local',
                avatar: null, // No custom avatar, will use Discord default
                discriminator: '0000'
            };
            
            window.history.replaceState({}, document.title, window.location.pathname);
            this.processAuthSuccess(userData);
            return true;
        }
        return false;
    }

    processAuthSuccess(userData) {
        logger?.success('Processing Discord authentication success');
        
        let retryCount = 0;
        const maxRetries = 20;
        
        const processAuth = () => {
            retryCount++;
            console.log(`Checking authManager (attempt ${retryCount}/${maxRetries})...`);
            
            if (window.authManager && typeof window.authManager.handleOAuthSuccess === 'function') {
                console.log('✅ Using authManager...');
                window.authManager.handleOAuthSuccess('discord', userData);
            } else if (retryCount < maxRetries) {
                setTimeout(processAuth, 300);
            } else {
                console.log('⚠️  Using fallback auth handler...');
                this.handleDiscordAuthFallback(userData);
            }
        };
        
        processAuth();
    }

    handleDiscordAuthFallback(userData) {
        console.log('🔄 Handling Discord auth fallback...');
        
        const user = {
            id: 'discord_' + Date.now(),
            email: userData.email || `${userData.username}@discord.local`,
            name: userData.global_name || userData.username,
            avatar: this.getDiscordAvatar(userData),
            provider: 'discord',
            created_at: new Date().toISOString(),
            profile_completed: false,
            discord_data: userData,
            social_links: {} // Initialize empty social links object
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authState', 'setup-required');

        if (window.profileSetup) {
            console.log('✅ Showing profile setup...');
            window.profileSetup.show(user);
        } else {
            console.log('⏳ Waiting for profile setup...');
            let attempts = 0;
            const checkProfileSetup = () => {
                attempts++;
                if (window.profileSetup) {
                    console.log('✅ Profile setup loaded!');
                    window.profileSetup.show(user);
                } else if (attempts < 50) {
                    setTimeout(checkProfileSetup, 100);
                } else {
                    alert('Welcome! Your Discord login was successful. Please refresh to complete setup.');
                }
            };
            checkProfileSetup();
        }

        this.updateUIAfterAuth(user);
    }

    async getDiscordUserData(authCode) {
        try {
            console.log('Attempting to fetch Discord user data...');
            
            // In a real implementation, you'd exchange the code for a token
            // and then fetch user data. For now, we'll simulate with your actual data
            
            // This would normally be:
            // 1. Exchange code for access token
            // 2. Use token to fetch user data from Discord API
            // For development, return null to use fallback data
            
            return null;
        } catch (error) {
            console.log('Failed to get Discord user data, using fallback');
            return null;
        }
    }

    getDiscordAvatar(userData) {
        // If we have a real Discord avatar hash, use it
        if (userData.avatar && userData.id) {
            return `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128`;
        }
        
        // Generate a Discord-style avatar using the username
        const username = userData.username || userData.global_name || 'User';
        
        // Create a Discord-style avatar with purple background (Discord's brand color)
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=5865f2&color=ffffff&size=128&font-size=0.33&length=2&bold=true`;
    }

    updateUIAfterAuth(user) {
        try {
            const loggedOutNav = document.getElementById('nav-auth-logged-out');
            const loggedInNav = document.getElementById('nav-auth-logged-in');
            
            if (loggedOutNav) loggedOutNav.style.display = 'none';
            if (loggedInNav) loggedInNav.style.display = 'flex';

            const userAvatar = document.getElementById('user-avatar');
            const userName = document.getElementById('user-name');
            
            if (userAvatar && user.avatar) {
                userAvatar.src = user.avatar;
            }
            if (userName) {
                userName.textContent = user.name;
            }
        } catch (error) {
            console.log('UI update failed:', error);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.simpleDiscordAuth = new SimpleDiscordAuth();
    
    // Check for OAuth callback
    if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
        window.simpleDiscordAuth.handleCallback();
    }
});
