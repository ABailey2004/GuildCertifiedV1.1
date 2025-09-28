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
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname === '';
            
            if (isLocalhost) {
                return window.location.origin;
            } else {
                // Production environment
                return window.location.origin;
            }
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
