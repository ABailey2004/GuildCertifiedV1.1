// Simple OAuth2 for user authentication only (no Google Sheets access)
class SimpleOAuth2 {
    constructor() {
        this.clientId = CONFIG.OAUTH.GOOGLE_CLIENT_ID;
        this.scopes = 'email profile'; // Simple scopes - just basic user info
        this.isSignedIn = false;
        this.currentUser = null;
    }

    // Initialize Google Identity Services
    async initialize() {
        try {
            console.log('🔄 Initializing simple OAuth2...');
            
            // Load Google Identity Services
            await new Promise((resolve, reject) => {
                if (window.google && window.google.accounts) {
                    resolve();
                } else {
                    const script = document.createElement('script');
                    script.src = 'https://accounts.google.com/gsi/client';
                    script.onload = () => setTimeout(resolve, 500);
                    script.onerror = reject;
                    document.head.appendChild(script);
                }
            });

            console.log('✅ Simple OAuth2 initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize OAuth2:', error);
            throw error;
        }
    }

    // Sign in with Google (just for user identification)
    async signIn() {
        try {
            if (!window.google) {
                await this.initialize();
            }

            console.log('🔑 Starting Google sign-in...');

            // Use Google One Tap or redirect flow
            google.accounts.id.initialize({
                client_id: this.clientId,
                callback: (response) => this.handleCredentialResponse(response)
            });

            // Show Google sign-in
            google.accounts.id.prompt();

        } catch (error) {
            console.error('❌ Sign-in failed:', error);
            throw error;
        }
    }

    // Handle the credential response
    async handleCredentialResponse(response) {
        try {
            // Decode JWT token
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            
            this.currentUser = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                provider: 'google'
            };
            
            this.isSignedIn = true;
            
            console.log('✅ User authenticated:', this.currentUser.name);
            
            // Save user data locally (no Google Sheets access needed)
            const savedUser = this.saveUserData(this.currentUser);
            
            // Update auth state
            this.updateAuthUI();
            
            return savedUser;
            
        } catch (error) {
            console.error('❌ Auth processing failed:', error);
            throw error;
        }
    }

    // Save user data to localStorage (clean and simple)
    saveUserData(userData) {
        try {
            console.log('💾 Saving user data locally...');
            
            // Use localStorage for user data
            const savedUser = window.localData.addUser(userData);
            
            // Integrate with main auth system
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
            
            console.log('✅ User data saved successfully');
            return savedUser;
            
        } catch (error) {
            console.error('❌ Failed to save user data:', error);
            throw error;
        }
    }

    // Update UI
    updateAuthUI() {
        const event = new CustomEvent('authStateChanged', {
            detail: {
                isSignedIn: this.isSignedIn,
                user: this.currentUser
            }
        });
        document.dispatchEvent(event);
    }

    // Sign out
    signOut() {
        this.isSignedIn = false;
        this.currentUser = null;
        this.updateAuthUI();
        console.log('✅ User signed out');
    }
}

// Create global instance
window.simpleOAuth2 = new SimpleOAuth2();
