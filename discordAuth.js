// Simple Discord OAuth2 Authentication
class DiscordAuth {
    constructor(options = {}) {
        this.clientId = options.clientId || CONFIG.OAUTH.DISCORD_CLIENT_ID;
        this.redirectUri = options.redirectUri || window.location.origin + '/auth/discord/callback';
        this.scopes = options.scopes ? options.scopes.join(' ') : 'identify email';
        this.currentUser = null;
        this.isSignedIn = false;
    }

    // Start Discord OAuth flow (alias for authenticate)
    async authenticate() {
        return this.signIn();
    }

    // Start Discord OAuth flow
    signIn() {
        console.log('🎮 Starting Discord OAuth...');
        
        if (this.clientId === 'your-discord-client-id') {
            console.warn('⚠️ Discord Client ID not configured, using manual sign-up');
            this.showManualSignUp();
            return;
        }

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: this.scopes,
            prompt: 'consent'
        });

        const authUrl = 'https://discord.com/api/oauth2/authorize?' + params.toString();
        window.location.href = authUrl;
    }

    // Handle OAuth callback
    async handleCallback(code, state) {
        if (!code) {
            const urlParams = new URLSearchParams(window.location.search);
            code = urlParams.get('code');
            const error = urlParams.get('error');

            if (error) {
                console.error('❌ Discord OAuth error:', error);
                throw new Error('Discord authentication failed: ' + error);
            }

            if (!code) {
                throw new Error('No authorization code received');
            }
        }

        try {
            console.log('🔄 Processing Discord OAuth callback...');
            
            // In a real app, you'd exchange the code for tokens on your server
            // For now, we'll simulate getting user data
            const userData = await this.simulateTokenExchange(code);
            
            this.currentUser = userData;
            this.isSignedIn = true;
            
            return userData;
            
        } catch (error) {
            console.error('❌ Failed to process Discord callback:', error);
            throw new Error('Failed to complete Discord authentication');
        }
    }

    // Simulate token exchange (in real app, this would be done on your server)
    async simulateTokenExchange(code) {
        console.log('🔄 Simulating Discord user data...');
        
        // In a real implementation, you'd send the code to your server
        // and get back user data. For now, we'll create realistic mock data
        const randomId = Date.now().toString();
        const randomNum = Math.floor(Math.random() * 1000);
        const username = 'GuildUser' + randomNum;
        const discriminator = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        
        return {
            id: randomId,
            username: username,
            discriminator: discriminator,
            global_name: `Guild User ${randomNum}`,
            email: `${username.toLowerCase()}@discord.example`,
            avatar: `${randomId}`,
            verified: true,
            provider: 'discord'
        };
    }

    // Save user data to localStorage
    saveUserData(userData) {
        console.log('💾 Saving Discord user data...');
        
        if (window.localData) {
            return localData.addUser({
                email: userData.email,
                name: userData.name,
                avatar: userData.picture,
                provider: 'discord',
                profileType: 'server'
            });
        }
        
        return userData;
    }

    // Integrate with main auth system
    integrateWithAuthSystem(savedUser) {
        console.log('🔗 Integrating with main auth system...');
        
        if (window.authManager) {
            authManager.hideLoginModal();
            
            authManager.currentUser = {
                ...savedUser,
                created_at: new Date().toISOString(),
                profile_completed: false
            };
            
            authManager.authState = 'setup-required';
            authManager.updateUI();
            authManager.saveAuthState();
            
            // Redirect to remove OAuth params from URL, then show profile setup
            const cleanUrl = window.location.origin + window.location.pathname;
            history.replaceState({}, document.title, cleanUrl);
            
            setTimeout(() => {
                authManager.showProfileSetup();
                
                if (!window.profileSetup) {
                    window.location.href = 'dashboard.html';
                }
            }, 100);
        }
    }

    // Manual sign-up fallback
    showManualSignUp() {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                    <h3 style="margin-top: 0; color: #333;">🎮 Discord Account</h3>
                    <p style="color: #666; margin-bottom: 20px;">Enter your Discord info to continue:</p>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Discord Username:</label>
                        <input id="discord-username" type="text" placeholder="YourUsername#1234" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px;">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email:</label>
                        <input id="discord-email" type="email" placeholder="your@email.com" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px;">
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button id="discord-submit" style="flex: 1; background: #5865F2; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 16px; cursor: pointer;">
                            Continue
                        </button>
                        <button id="discord-cancel" style="flex: 1; background: #6c757d; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 16px; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => document.getElementById('discord-username').focus(), 100);
        
        document.getElementById('discord-submit').onclick = () => {
            const username = document.getElementById('discord-username').value.trim();
            const email = document.getElementById('discord-email').value.trim();
            
            if (!username || !email) {
                alert('Please fill in both username and email');
                return;
            }
            
            const userData = {
                id: 'discord_' + Date.now(),
                name: username,
                email: email,
                picture: `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`,
                provider: 'discord'
            };
            
            const savedUser = this.saveUserData(userData);
            this.integrateWithAuthSystem(savedUser);
            document.body.removeChild(modal);
        };
        
        document.getElementById('discord-cancel').onclick = () => {
            document.body.removeChild(modal);
        };
    }

    showError(message) {
        console.error('Discord Auth Error:', message);
        alert(message);
    }
}

// Create global instance
window.discordAuth = new DiscordAuth();

// Check for OAuth callback on page load
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/auth/discord' || window.location.search.includes('code=')) {
        discordAuth.handleCallback();
    }
});