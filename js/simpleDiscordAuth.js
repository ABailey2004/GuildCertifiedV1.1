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
        console.log('🔄 Starting Discord OAuth authentication...');
        
        // Validate client ID
        if (!this.clientId || this.clientId === 'your-discord-client-id') {
            console.error('❌ Discord Client ID not configured!');
            alert('Discord authentication is not properly configured. Please check the client ID.');
            return;
        }
        
        // Check if redirect URI might be the issue
        const redirectInfo = CONFIG.OAUTH.getRedirectUriInfo();
        if (redirectInfo.isCloudflare) {
            console.log('☁️ Cloudflare tunnel detected:', redirectInfo.current);
            console.log('📋 Add this to Discord Developer Portal:', redirectInfo.instructions);
        }
        
        // Use config helper for URL generation
        const authUrl = CONFIG.OAUTH.getDiscordAuthUrl(this.redirectUri);
        console.log('🔗 Discord auth URL:', authUrl);
        
        // Store auth state
        localStorage.setItem('discord_auth_started', 'true');
        localStorage.setItem('discord_redirect_uri', this.redirectUri);
        
        // Redirect to Discord
        window.location.href = authUrl;
    }

    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('🔄 Handling Discord OAuth callback...');
        
        if (error) {
            console.error('❌ Discord OAuth error:', error, errorDescription);
            alert(`Discord authentication failed: ${error}\n${errorDescription || 'Please try again.'}`);
            localStorage.removeItem('discord_auth_started');
            return false;
        }

        if (code && localStorage.getItem('discord_auth_started')) {
            console.log('✅ Discord OAuth callback successful, processing...');
            localStorage.removeItem('discord_auth_started');
            localStorage.removeItem('discord_redirect_uri');
            
            // Try to get real Discord data - for development we'll use simulated info
            const userData = await this.getDiscordUserData(code) || {
                id: '123456789012345678', // Simulated Discord user ID for default avatar
                username: 'fwf2_', // Your actual Discord username
                global_name: 'fwf2_',
                email: 'fwf2_@discord.local',
                avatar: null, // No custom avatar, will use Discord default
                discriminator: '0000'
            };
            
            console.log('👤 Discord user data:', userData);
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            this.processAuthSuccess(userData);
            return true;
        }
        
        if (code) {
            console.warn('⚠️ Discord code received but no auth session found - possible redirect URI mismatch');
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

// Initialize and bind Discord auth
document.addEventListener('DOMContentLoaded', () => {
    window.simpleDiscordAuth = new SimpleDiscordAuth();
    
    // Check for OAuth callback first
    if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
        window.simpleDiscordAuth.handleCallback();
    }
    
    // Bind Discord auth buttons
    bindDiscordAuthButtons();
});

// Bind Discord authentication buttons
function bindDiscordAuthButtons() {
    console.log('🔗 Binding Discord auth buttons...');
    
    // Find all Discord auth buttons
    const discordButtons = document.querySelectorAll('[data-provider="discord"], .discord-login, #discord-login, .btn-oauth.discord');
    
    console.log(`Found ${discordButtons.length} Discord auth button(s)`);
    
    discordButtons.forEach((button, index) => {
        console.log(`Binding Discord button ${index + 1}:`, button.className, button.id);
        
        // Remove existing listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add click handler
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🎮 Discord auth button clicked!');
            
            if (window.simpleDiscordAuth) {
                window.simpleDiscordAuth.startAuth();
            } else {
                console.error('❌ simpleDiscordAuth not available');
                alert('Discord authentication system not loaded. Please refresh the page.');
            }
        });
        
        // Visual feedback
        newButton.style.cursor = 'pointer';
    });
    
    // Also check for dynamically created buttons (for modals)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-provider="discord"], .discord-login, #discord-login, .btn-oauth.discord');
        if (target && !target.hasAttribute('data-discord-bound')) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🎮 Dynamic Discord button clicked!');
            target.setAttribute('data-discord-bound', 'true');
            
            if (window.simpleDiscordAuth) {
                window.simpleDiscordAuth.startAuth();
            } else {
                console.error('❌ simpleDiscordAuth not available');
                alert('Discord authentication system not loaded. Please refresh the page.');
            }
        }
    });
}
