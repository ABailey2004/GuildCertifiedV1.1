// Configuration for Google Sheets API
const CONFIG = {
    // Google Sheets configuration
    GOOGLE_SHEETS: {
        // ✅ Your Google Sheets API Key:
        API_KEY: 'AIzaSyA7mS1AGLQbY8kl-MEdQdi7jIH3D_IEHag', // From Google Cloud Console
        SHEET_ID: '1mpjZU7X2SagVCo4I75Rhrwq2Z79pf0SM6ag_biH7ivw', // ✅ Your Sheet ID
        
        // Sheet names (tabs in your Google Sheet)
        SHEETS: {
            SERVERS: 'Servers',
            REVIEWS: 'Reviews',
            USERS: 'Users',
            PROFILES: 'Profiles'
        }
    },
    
    // Application settings
    APP: {
        NAME: 'GuildCertified',
        VERSION: '1.0.0',
        MAX_REVIEWS_PER_LOAD: 10,
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
    },
    
    // OAuth configuration - Discord only for simplicity
    OAUTH: {
        DISCORD_CLIENT_ID: '1421352374102130788', // From Discord Developer Portal
        // Auto-detect redirect URI based on environment
        getRedirectUri() {
            const hostname = window.location.hostname;
            const origin = window.location.origin;
            
            console.log('🌐 Detecting environment:', { hostname, origin });
            
            const isLocalhost = hostname === 'localhost' || 
                               hostname === '127.0.0.1' ||
                               hostname === '';
            
            const isCloudflare = hostname.includes('trycloudflare.com') || 
                                hostname.includes('.cloudflare.com') ||
                                hostname.includes('.pages.dev');
            
            if (isLocalhost) {
                // For localhost, use exact format Discord expects
                const port = window.location.port ? `:${window.location.port}` : '';
                const redirectUri = `http://localhost${port}`;
                console.log('🏠 Using localhost redirect:', redirectUri);
                return redirectUri;
            } else if (isCloudflare) {
                // For Cloudflare tunnels, use full origin
                console.log('☁️ Using Cloudflare redirect:', origin);
                return origin;
            } else {
                // Production/other environments
                console.log('🌍 Using production redirect:', origin);
                return origin;
            }
        },
        
        // Get Discord authorization URL
        getDiscordAuthUrl(redirectUri, state) {
            const params = new URLSearchParams({
                client_id: this.DISCORD_CLIENT_ID,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'identify email',
                state: state || 'discord_auth_' + Date.now()
            });
            return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
        },
        
        // Get current redirect URI info for Discord setup
        getRedirectUriInfo() {
            const currentUri = this.getRedirectUri();
            const hostname = window.location.hostname;
            
            return {
                current: currentUri,
                isCloudflare: hostname.includes('trycloudflare.com'),
                isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1',
                setupUrl: 'https://discord.com/developers/applications',
                instructions: `Add this redirect URI to your Discord app: ${currentUri}`
            };
        }
    },

    // Default categories for Discord servers
    CATEGORIES: [
        'gaming',
        'art',
        'music',
        'education',
        'community',
        'technology',
        'entertainment'
    ],
    
    // Rating system
    RATING: {
        MIN: 1,
        MAX: 5,
        DEFAULT: 5
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
