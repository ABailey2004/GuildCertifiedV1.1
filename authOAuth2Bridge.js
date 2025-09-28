// Integration bridge between existing auth system and OAuth2 Sheets
class AuthOAuth2Bridge {
    constructor() {
        this.initialized = false;
        this.init();
    }

    async init() {
        // Wait for all systems to be ready
        await this.waitForSystems();
        
        // Give systems a moment to fully initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Listen for successful OAuth2 authentication
        document.addEventListener('authStateChanged', (event) => {
            this.handleOAuth2Success(event.detail);
        });

        // Override Google login button behavior
        this.overrideGoogleLogin();
        
        this.initialized = true;
        console.log('✅ Auth-OAuth2 bridge initialized');
    }

    async waitForSystems() {
        let attempts = 0;
        while (attempts < 50) { // Wait up to 5 seconds
            if (window.AuthManager && window.oauth2Sheets && window.localData && window.authManager) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        console.warn('⚠️ Some systems not ready, proceeding anyway');
    }

    overrideGoogleLogin() {
        // Override the AuthManager's loginWithGoogle method
        if (window.authManager && typeof window.authManager.loginWithGoogle === 'function') {
            const originalLoginWithGoogle = window.authManager.loginWithGoogle;
            
            window.authManager.loginWithGoogle = async () => {
                console.log('🔗 Google login intercepted - using OAuth2 integration');
                
                try {
                    // Check if OAuth2 is properly configured
                    if (CONFIG.OAUTH.GOOGLE_CLIENT_ID === 'PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID_HERE') {
                        console.warn('⚠️ OAuth2 not configured, using fallback');
                        this.useFallbackAuth();
                        return;
                    }

                    // Initialize OAuth2 if needed
                    if (!oauth2Sheets.isSignedIn) {
                        await oauth2Sheets.initialize();
                    }

                    // Use OAuth2 system
                    await oauth2Sheets.signIn();
                    
                } catch (error) {
                    console.error('❌ OAuth2 login failed:', error);
                    // Fall back to original method
                    originalLoginWithGoogle.call(window.authManager);
                }
            };
            
            console.log('✅ Google login method overridden with OAuth2');
        }
        
        // Also find and override any direct button clicks
        const googleButtons = document.querySelectorAll('#google-login, [data-provider="google"], .google-login');
        
        googleButtons.forEach(button => {
            // Remove existing event listeners by cloning the button
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🔗 Google login button clicked - using OAuth2');
                
                try {
                    // Check if OAuth2 is properly configured
                    if (CONFIG.OAUTH.GOOGLE_CLIENT_ID === 'PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID_HERE') {
                        console.warn('⚠️ OAuth2 not configured, using fallback');
                        this.useFallbackAuth();
                        return;
                    }

                    // Try OAuth2 first, but have a quick timeout
                    console.log('🚀 Attempting Google OAuth2...');
                    
                    const oauthPromise = new Promise(async (resolve, reject) => {
                        try {
                            await simpleOAuth2.initialize();
                            await simpleOAuth2.signIn();
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    });
                    
                    // Set a timeout for OAuth2 attempt
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('OAuth2 timeout')), 3000)
                    );
                    
                    await Promise.race([oauthPromise, timeoutPromise]);
                    
                } catch (error) {
                    console.log('⚠️ Google OAuth2 not ready (still propagating), using manual sign-up');
                    this.useFallbackAuth();
                }
            });
        });
    }

    async handleOAuth2Success(authDetail) {
        if (!authDetail.isSignedIn || !authDetail.user) return;

        console.log('🎉 OAuth2 authentication successful, integrating with main auth system');
        
        try {
            // Update the main auth manager
            if (window.authManager) {
                authManager.currentUser = {
                    id: authDetail.user.id,
                    email: authDetail.user.email,
                    name: authDetail.user.name,
                    avatar: authDetail.user.picture,
                    provider: 'google',
                    created_at: new Date().toISOString(),
                    profile_completed: false // Will trigger profile setup
                };
                
                authManager.authState = 'setup-required';
                authManager.updateUI();
                authManager.saveAuthState();
                
                // Show profile setup if needed
                authManager.showProfileSetup();
                
                console.log('✅ Main auth system updated with OAuth2 user');
            }
            
        } catch (error) {
            console.error('❌ Failed to integrate OAuth2 with main auth:', error);
        }
    }

    useFallbackAuth() {
        console.log('📱 Using interactive fallback authentication');
        
        // Create a simple form for user to enter their info
        this.showFallbackSignInForm();
    }

    showFallbackSignInForm() {
        // Create modal for user input
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                    <h3 style="margin-top: 0; color: #333;">🚀 Quick Sign Up</h3>
                    <p style="color: #666; margin-bottom: 20px;">While we set up Google OAuth, you can create an account manually:</p>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Name:</label>
                        <input id="fallback-name" type="text" placeholder="Enter your name" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px;">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email:</label>
                        <input id="fallback-email" type="email" placeholder="Enter your email" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px;">
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button id="fallback-submit" style="flex: 1; background: #00b67a; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 16px; cursor: pointer;">
                            Create Account
                        </button>
                        <button id="fallback-cancel" style="flex: 1; background: #6c757d; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 16px; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus on name field
        setTimeout(() => document.getElementById('fallback-name').focus(), 100);
        
        // Handle form submission
        document.getElementById('fallback-submit').onclick = () => {
            const name = document.getElementById('fallback-name').value.trim();
            const email = document.getElementById('fallback-email').value.trim();
            
            if (!name || !email) {
                alert('Please fill in both name and email');
                return;
            }
            
            // Create user with entered data
            const userData = {
                id: 'user_' + Date.now(),
                email: email,
                name: name,
                picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00b67a&color=fff&size=64`,
                provider: 'manual'
            };
            
            console.log('🔄 Creating manual user:', userData);
            
            // Save user
            if (window.localData) {
                const savedUser = localData.addUser({
                    email: userData.email,
                    name: userData.name,
                    avatar: userData.picture,
                    provider: 'manual',
                    profileType: 'server'
                });
                
                console.log('✅ Manual user created:', savedUser);
                console.log('🔍 AuthManager available:', !!window.authManager);
                console.log('🔍 ProfileSetup available:', !!window.profileSetup);
                
                // Update main auth system
                if (window.authManager) {
                    // Hide login modal first
                    authManager.hideLoginModal();
                    
                    // Set user data
                    authManager.currentUser = {
                        ...savedUser,
                        created_at: new Date().toISOString(),
                        profile_completed: false
                    };
                    
                    authManager.authState = 'setup-required';
                    authManager.updateUI();
                    authManager.saveAuthState();
                    
                    // Show profile setup with a small delay to ensure DOM is ready
                    setTimeout(() => {
                        console.log('🔄 Triggering profile setup...');
                        authManager.showProfileSetup();
                        
                        // Fallback: if profileSetup doesn't exist, redirect to dashboard
                        if (!window.profileSetup) {
                            console.log('⚠️ ProfileSetup not found, redirecting to dashboard...');
                            window.location.href = 'dashboard.html';
                        }
                    }, 100);
                }
            }
            
            // Remove modal
            document.body.removeChild(modal);
        };
        
        // Handle cancel
        document.getElementById('fallback-cancel').onclick = () => {
            document.body.removeChild(modal);
        };
        
        // Handle escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }

    // Manual trigger for testing
    async testOAuth2Integration() {
        console.log('🧪 Testing OAuth2 integration...');
        
        try {
            if (CONFIG.OAUTH.GOOGLE_CLIENT_ID === 'PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID_HERE') {
                console.log('⚠️ OAuth2 not configured, testing fallback...');
                this.useFallbackAuth();
                return;
            }

            await oauth2Sheets.signIn();
            console.log('✅ OAuth2 integration test completed');
            
        } catch (error) {
            console.error('❌ OAuth2 integration test failed:', error);
            this.useFallbackAuth();
        }
    }
}

// Initialize the bridge when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authOAuth2Bridge = new AuthOAuth2Bridge();
    });
} else {
    window.authOAuth2Bridge = new AuthOAuth2Bridge();
}