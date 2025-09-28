// Enhanced OAuth2 + Google Sheets integration
class OAuth2SheetsManager {
    constructor() {
        this.clientId = CONFIG.OAUTH.GOOGLE_CLIENT_ID;
        this.apiKey = CONFIG.GOOGLE_SHEETS.API_KEY;
        this.sheetId = CONFIG.GOOGLE_SHEETS.SHEET_ID;
        this.discoveryDoc = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
        this.scopes = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
        
        this.gapi = null;
        this.tokenClient = null;
        this.isSignedIn = false;
        this.currentUser = null;
    }

    // Initialize Google APIs
    async initialize() {
        try {
            console.log('🔄 Initializing Google APIs...');
            
            // Load gapi
            await new Promise((resolve, reject) => {
                if (window.gapi) {
                    resolve();
                } else {
                    const script = document.createElement('script');
                    script.src = 'https://apis.google.com/js/api.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                }
            });

            // Initialize gapi
            await new Promise((resolve) => {
                gapi.load('client', resolve);
            });

            await gapi.client.init({
                apiKey: this.apiKey,
                discoveryDocs: [this.discoveryDoc],
            });

            // Load Google Identity Services for OAuth2
            await new Promise((resolve, reject) => {
                if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                    resolve();
                } else {
                    const script = document.createElement('script');
                    script.src = 'https://accounts.google.com/gsi/client';
                    script.onload = () => {
                        // Wait a moment for Google APIs to fully initialize
                        setTimeout(resolve, 500);
                    };
                    script.onerror = reject;
                    document.head.appendChild(script);
                }
            });

            // Initialize token client
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.scopes,
                callback: (tokenResponse) => {
                    console.log('✅ OAuth2 token received');
                    this.handleAuthSuccess(tokenResponse);
                },
            });

            console.log('✅ Google APIs initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Google APIs:', error);
            throw error;
        }
    }

    // Sign in with Google
    async signIn() {
        try {
            if (!this.tokenClient) {
                await this.initialize();
            }

            console.log('🔄 Starting OAuth2 sign-in...');
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
            console.error('❌ Sign-in failed:', error);
            throw error;
        }
    }

    // Handle successful authentication
    async handleAuthSuccess(tokenResponse) {
        try {
            console.log('🔄 Processing authentication...');
            
            // Get user info
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${tokenResponse.access_token}`
                }
            });
            
            const userInfo = await userInfoResponse.json();
            
            this.currentUser = {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                provider: 'google'
            };
            
            this.isSignedIn = true;
            
            // Store token for API calls
            gapi.client.setToken(tokenResponse);
            
            console.log('✅ User authenticated:', this.currentUser.name);
            
            // Save user to Google Sheets
            const savedUser = await this.saveUserToSheets(this.currentUser);
            
            // Update UI and trigger auth state change
            this.updateAuthUI();
            
            // Also integrate with main auth system
            if (window.authManager) {
                authManager.currentUser = {
                    ...savedUser,
                    created_at: new Date().toISOString(),
                    profile_completed: false
                };
                authManager.authState = 'setup-required';
                authManager.updateUI();
                authManager.saveAuthState();
                authManager.showProfileSetup();
            }
            
            return this.currentUser;
        } catch (error) {
            console.error('❌ Auth processing failed:', error);
            throw error;
        }
    }

    // Save user data (using localStorage since we removed Sheets permission)
    async saveUserToSheets(userData) {
        try {
            console.log('💾 Saving user data to localStorage...');
            
            // Use localStorage as primary storage (no scary permissions needed)
            const savedUser = window.localData.addUser(userData);
            
            console.log('✅ User data saved successfully');
            return savedUser;
            
        } catch (error) {
            console.error('❌ Failed to save user data:', error);
            throw error;
        }
    }

    // Get users from Google Sheets
    async getUsersFromSheets() {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: 'Users!A:H',
            });
            
            const rows = response.result.values || [];
            if (rows.length === 0) return [];
            
            // Convert rows to objects (skip header row)
            const headers = ['id', 'email', 'name', 'avatar', 'provider', 'created', 'profileType', 'status'];
            return rows.slice(1).map(row => {
                const user = {};
                headers.forEach((header, index) => {
                    user[header] = row[index] || '';
                });
                return user;
            });
        } catch (error) {
            console.error('❌ Failed to get users from sheets:', error);
            return [];
        }
    }

    // Initialize sheets with headers
    async initializeSheets() {
        try {
            console.log('🔄 Initializing Google Sheets structure...');
            
            const sheetsData = [
                {
                    range: 'Users!A1:H1',
                    values: [['ID', 'Email', 'Name', 'Avatar', 'Provider', 'Created', 'Profile_Type', 'Status']]
                },
                {
                    range: 'Servers!A1:I1', 
                    values: [['ID', 'Name', 'Description', 'Category', 'Owner_ID', 'Created', 'Logo', 'Rating', 'Review_Count']]
                },
                {
                    range: 'Reviews!A1:G1',
                    values: [['ID', 'Server_ID', 'User_ID', 'Rating', 'Comment', 'Created', 'Status']]
                },
                {
                    range: 'Profiles!A1:H1',
                    values: [['ID', 'User_ID', 'Business_Name', 'Description', 'Website', 'Discord', 'Social_Links', 'Logo']]
                }
            ];
            
            for (const sheetData of sheetsData) {
                try {
                    await gapi.client.sheets.spreadsheets.values.update({
                        spreadsheetId: this.sheetId,
                        range: sheetData.range,
                        valueInputOption: 'USER_ENTERED',
                        resource: {
                            values: sheetData.values
                        }
                    });
                    console.log(`✅ Headers set for ${sheetData.range}`);
                } catch (error) {
                    console.log(`⚠️ Could not set headers for ${sheetData.range}:`, error.message);
                }
            }
            
            console.log('✅ Google Sheets structure initialized');
        } catch (error) {
            console.error('❌ Failed to initialize sheets:', error);
        }
    }

    // Sign out
    signOut() {
        if (gapi.client.getToken()) {
            google.accounts.oauth2.revoke(gapi.client.getToken().access_token);
            gapi.client.setToken('');
        }
        this.isSignedIn = false;
        this.currentUser = null;
        this.updateAuthUI();
        console.log('✅ User signed out');
    }

    // Update authentication UI
    updateAuthUI() {
        const event = new CustomEvent('authStateChanged', {
            detail: {
                isSignedIn: this.isSignedIn,
                user: this.currentUser
            }
        });
        document.dispatchEvent(event);
    }

    // Get current authentication status
    getAuthStatus() {
        return {
            isSignedIn: this.isSignedIn,
            user: this.currentUser
        };
    }
}

// Create global instance
window.oauth2Sheets = new OAuth2SheetsManager();
