// Simplified Discord-only Authentication system for GuildCertified
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authState = 'logged-out'; // logged-out, logged-in, setup-required
        this.discordAuth = null;
        
        // Session persistence settings
        this.sessionSettings = {
            requireAuthOnNewSession: true,  // Require auth when browser reopened
            maxDuration: 1800000,          // 30 minutes of inactivity (optional)
            extendOnActivity: true         // Extend session on user activity
        };
        
        this.init();
    }

    // Session management methods
    isSessionValid() {
        const sessionData = this.getSessionData();
        if (!sessionData || !sessionData.sessionStart) {
            return false;
        }

        const now = Date.now();
        const timeSinceLastActivity = now - sessionData.lastActivity;
        
        // Check if session has expired due to inactivity (optional)
        if (this.sessionSettings.maxDuration && timeSinceLastActivity > this.sessionSettings.maxDuration) {
            console.log('Session expired due to inactivity');
            return false;
        }

        return true;
    }

    getSessionData() {
        const sessionStr = sessionStorage.getItem('discord_session');
        if (!sessionStr) return null;
        
        try {
            return JSON.parse(sessionStr);
        } catch (e) {
            console.warn('Invalid session data, clearing:', e);
            sessionStorage.removeItem('discord_session');
            return null;
        }
    }

    updateSession() {
        let sessionData = this.getSessionData();
        const now = Date.now();

        if (!sessionData) {
            // Create new browser session
            sessionData = {
                sessionStart: now,
                lastActivity: now,
                authenticated: false
            };
        } else {
            // Update existing session activity
            if (this.sessionSettings.extendOnActivity) {
                sessionData.lastActivity = now;
            }
        }

        sessionStorage.setItem('discord_session', JSON.stringify(sessionData));
        console.log('Session updated:', sessionData);
        return sessionData;
    }

    clearSession() {
        sessionStorage.removeItem('discord_session');
        console.log('Session cleared');
    }

    init() {
        this.initializeDiscordAuth();
        this.bindEvents();
        this.checkExistingAuth();
    }

    // Debug method to show session status (for testing)
    showSessionStatus() {
        const sessionData = this.getSessionData();
        const isValid = this.isSessionValid();
        
        if (sessionData) {
            const timeSinceStart = Date.now() - sessionData.sessionStart;
            const timeSinceActivity = Date.now() - sessionData.lastActivity;
            
            console.log('🔍 Session Status:', {
                authenticated: sessionData.authenticated,
                timeSinceStart: Math.floor(timeSinceStart / 1000) + 's',
                timeSinceActivity: Math.floor(timeSinceActivity / 1000) + 's',
                maxInactivity: Math.floor(this.sessionSettings.maxDuration / 1000) + 's',
                sessionValid: isValid,
                isNewSession: !sessionData.authenticated
            });
        } else {
            console.log('🔍 No session data found - new browser session');
        }
    }

    initializeDiscordAuth() {
        // Discord auth is now handled by simpleDiscordAuth.js
        console.log('Discord Auth will be handled by simpleDiscordAuth');
        this.discordAuth = null; // Not needed anymore
    }

    bindEvents() {
        // Login button
        document.getElementById('login-btn')?.addEventListener('click', (e) => {
            // Only show login modal if user is not already logged in
            if (!this.currentUser && this.authState !== 'logged-in') {
                this.showLoginModal();
            } else {
                // If user is logged in, prevent any default action
                e.preventDefault();
                e.stopPropagation();
                console.log('Login button clicked but user is already logged in');
            }
        });

        // Discord OAuth button
        document.getElementById('discord-login')?.addEventListener('click', () => {
            this.loginWithDiscord();
        });



        // Logout button - use event delegation
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
                e.preventDefault();
                console.log('Logout clicked');
                this.logout();
            }
            
            // Server setup button - redirect to dashboard
            if (e.target.id === 'setup-server-btn' || e.target.closest('#setup-server-btn')) {
                e.preventDefault();
                console.log('Server setup clicked');
                // If we're not on dashboard, redirect there and then show modal
                if (!window.location.pathname.includes('dashboard.html')) {
                    window.location.href = 'dashboard.html?setup-server=true';
                } else if (window.dashboard && window.dashboard.showServerSetupModal) {
                    window.dashboard.showServerSetupModal();
                }
            }
        });

        // User menu dropdown toggle - use event delegation
        document.addEventListener('click', (e) => {
            const userMenu = e.target.closest('.user-menu');
            const dropdown = document.querySelector('.dropdown-menu');
            const isDropdownClick = e.target.closest('.dropdown-menu');
            
            if (userMenu && dropdown && !isDropdownClick) {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('show');
                console.log('🔽 User menu clicked - Dropdown toggled:', dropdown.classList.contains('show'));
            } else if (dropdown && !e.target.closest('.dropdown-menu') && !userMenu) {
                // Close dropdown when clicking outside
                dropdown.classList.remove('show');
                console.log('🔼 Dropdown closed from outside click');
            }
        });

        // Close modal buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        // Display session info for debugging
        console.log('=== SESSION INFO ===');
        this.showSessionStatus();

        // Handle Discord OAuth callback
        this.handleOAuthCallback();
    }

    showLoginModal() {
        document.getElementById('login-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideLoginModal() {
        document.getElementById('login-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async loginWithDiscord() {
        try {
            console.log('Starting Discord OAuth flow...');
            
            // Check if simple Discord auth is available
            if (window.simpleDiscordAuth) {
                console.log('Using simple Discord auth...');
                window.simpleDiscordAuth.startAuth();
                return;
            }
            
            // If simpleDiscordAuth isn't loaded yet, wait and retry multiple times
            console.log('Waiting for simpleDiscordAuth to load...');
            let attempts = 0;
            const maxAttempts = 30; // 6 seconds total
            
            const checkAuth = () => {
                attempts++;
                if (window.simpleDiscordAuth) {
                    console.log('✅ Simple Discord auth loaded, starting flow...');
                    window.simpleDiscordAuth.startAuth();
                } else if (attempts < maxAttempts) {
                    console.log(`Retrying... (${attempts}/${maxAttempts})`);
                    setTimeout(checkAuth, 200);
                } else {
                    console.error('❌ Discord auth failed to load after 6 seconds');
                    this.showError('Discord authentication system not loaded. Please refresh the page.');
                }
            };
            
            // Start checking
            checkAuth();
            
        } catch (error) {
            console.error('Discord login failed:', error);
            this.showError(`Discord login failed: ${error.message}`);
        }
    }



    handleOAuthCallback() {
        // OAuth callback is now handled by simpleDiscordAuth.js
        // This method is kept for compatibility but does nothing
        console.log('OAuth callback handling moved to simpleDiscordAuth.js');
    }

    async handleOAuthSuccess(provider, userData) {
        console.log(`${provider} OAuth success:`, userData);
        
        try {
            // Check if user already exists by Discord ID
            let existingUser = null;
            if (window.localData) {
                existingUser = window.localData.getUserByDiscordId(userData.id);
            }

            let user;
            if (existingUser) {
                // User exists, update their info and restore their profile
                console.log('Existing user found:', existingUser.name || existingUser.displayName);
                user = {
                    ...existingUser,
                    // Update with fresh Discord data but keep existing profile
                    name: userData.username || userData.global_name || userData.name || existingUser.name || 'DiscordUser',
                    displayName: userData.global_name || userData.username || existingUser.displayName || 'Discord User',
                    email: userData.email || existingUser.email || '',
                    avatar: userData.avatar && userData.id ? 
                        `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128` : 
                        existingUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.username || 'User')}&background=5865f2&color=ffffff&size=128&font-size=0.33&length=2&bold=true`,
                    discriminator: userData.discriminator || '0000',
                    // Keep existing profile data
                    profile_completed: existingUser.profile_completed || false,
                    profileType: existingUser.profileType || 'server',
                    bio: existingUser.bio || `Verified Discord user: ${userData.username}#${userData.discriminator || '0000'}`,
                    social_links: existingUser.social_links || {},
                    // Update last login
                    lastLogin: new Date().toISOString()
                };
            } else {
                // New user, create fresh profile
                console.log('New user detected, creating profile');
                user = {
                    id: userData.id,
                    discord_id: userData.id,
                    provider: 'discord',
                    name: userData.username || userData.global_name || userData.name || 'DiscordUser',
                    displayName: userData.global_name || userData.username || 'Discord User',
                    email: userData.email || '',
                    avatar: userData.avatar && userData.id ? 
                        `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128` : 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.username || 'User')}&background=5865f2&color=ffffff&size=128&font-size=0.33&length=2&bold=true`,
                    discriminator: userData.discriminator || '0000',
                    joinDate: new Date().toISOString(),
                    profile_completed: false, // Will be set to true after profile setup
                    profileType: 'server', // Default to server type
                    isVerified: true,
                    bio: `Verified Discord user: ${userData.username}#${userData.discriminator || '0000'}`,
                    social_links: {} // Initialize empty social links object
                };
            }

            // Save user data
            this.currentUser = user;
            this.authState = user.profile_completed ? 'logged-in' : 'setup-required';
            
            // Save user data locally
            if (window.localData) {
                window.localData.saveUser(user);
            }
            
            // Mark session as authenticated
            const sessionData = this.updateSession();
            sessionData.authenticated = true;
            sessionStorage.setItem('discord_session', JSON.stringify(sessionData));
            
            // Hide login modal if it's open
            this.hideLoginModal();
            
            // Update UI immediately
            this.updateAuthUI();
            
            // Show appropriate message and next steps
            if (existingUser && user.profile_completed) {
                // Existing user with completed profile - welcome them back
                this.showSuccess(`Welcome back, ${user.displayName}! 🎮`);
                console.log('User profile already completed, no setup needed');
                // Optionally redirect to dashboard after a moment
                setTimeout(() => {
                    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                        window.location.href = 'dashboard.html';
                    }
                }, 1500);
            } else if (existingUser && !user.profile_completed) {
                // Existing user but incomplete profile
                this.showSuccess(`Welcome back, ${user.displayName}! Please finish setting up your profile. 🎮`);
                setTimeout(() => {
                    this.showProfileSetup(user);
                }, 500);
            } else {
                // New user
                this.showSuccess(`Welcome to GuildCertified, ${user.displayName}! 🎮`);
                setTimeout(() => {
                    this.showProfileSetup(user);
                }, 500);
            }
            
        } catch (error) {
            console.error('Error handling OAuth success:', error);
            this.showError('Failed to complete authentication. Please try again.');
        }
    }

    checkExistingAuth() {
        // Check for existing user session
        let savedUser = window.localData ? window.localData.getUser() : null;
        
        // Also check localStorage directly as fallback
        if (!savedUser) {
            const storedUserData = localStorage.getItem('currentUser');
            const storedAuthState = localStorage.getItem('authState');
            
            if (storedUserData && (storedAuthState === 'logged-in' || storedAuthState === 'setup-required')) {
                try {
                    savedUser = JSON.parse(storedUserData);
                    console.log('Found user in localStorage:', savedUser.name);
                } catch (e) {
                    console.error('Failed to parse stored user data:', e);
                }
            }
        }
        
        // Update session data (track browser session)
        const sessionData = this.updateSession();
        
        // Check if this is a new browser session (no session data means browser was closed/reopened)
        const isNewBrowserSession = !sessionData.authenticated;
        console.log('Session check - New browser session:', isNewBrowserSession, 'Session data:', sessionData);
        
        if (savedUser) {
            this.currentUser = savedUser;
            
            if (isNewBrowserSession && this.sessionSettings.requireAuthOnNewSession) {
                console.log('New browser session detected, requiring re-authentication');
                this.authState = 'logged-out';
                this.showAuthRequiredMessage();
            } else if (!savedUser.profile_completed) {
                console.log('User found but profile not completed, showing setup...');
                this.authState = 'setup-required';
                this.showProfileSetup();
            } else {
                console.log('Existing user session found:', savedUser.name);
                this.authState = 'logged-in';
                // Mark session as authenticated
                sessionData.authenticated = true;
                sessionStorage.setItem('discord_session', JSON.stringify(sessionData));
            }
            
            this.updateAuthUI();
        } else {
            console.log('No existing user, allowing access without auth');
            // Don't change auth state for guests, but track session
        }

        // Show session status for debugging
        this.showSessionStatus();
    }

    showAuthRequiredMessage() {
        const sessionData = this.getSessionData();
        const message = `Welcome back! Please re-authenticate to continue.\n\nNew browser session detected.`;
        
        console.log('Showing auth required message:', message);
        
        // Show a notification or modal to user
        if (confirm(message + '\n\nClick OK to authenticate now.')) {
            this.loginWithDiscord();
        }
    }



    updateAuthUI() {
        const loginBtn = document.getElementById('login-btn');
        const userProfile = document.getElementById('user-profile');
        const loggedOutNav = document.getElementById('nav-auth-logged-out');
        const loggedInNav = document.getElementById('nav-auth-logged-in');
        
        if (this.currentUser) {
            // Hide logged-out nav and show logged-in nav
            if (loggedOutNav) loggedOutNav.style.display = 'none';
            if (loggedInNav) {
                loggedInNav.style.display = 'flex';
                
                // Update the user avatar and name in the existing user menu structure
                const userAvatar = document.getElementById('user-avatar');
                const userName = document.getElementById('user-name');
                
                if (userAvatar) {
                    const avatarSrc = this.getAvatarUrl(this.currentUser, 48);
                    userAvatar.src = avatarSrc;
                    userAvatar.onerror = () => {
                        // Fallback to generated avatar
                        const fallbackName = this.currentUser.display_name || this.currentUser.name || 'User';
                        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=5865f2&color=fff&size=48&font-size=0.33&length=2&bold=true`;
                    };
                }
                
                if (userName) {
                    const displayName = this.currentUser.display_name || 
                                      (this.currentUser.discord_data && this.currentUser.discord_data.username) || 
                                      this.currentUser.name || 'User';
                    userName.textContent = displayName;
                }
            }
            
            // Update user profile if on dashboard
            if (userProfile) {
                userProfile.innerHTML = `
                    <div class="user-header">
                        <img src="${this.currentUser.avatar}" alt="Avatar" class="profile-avatar">
                        <div class="user-info">
                            <h3>${this.currentUser.name}</h3>
                            <p class="user-email">${this.currentUser.email}</p>
                            <span class="badge ${this.currentUser.provider}">${this.currentUser.provider}</span>
                        </div>
                    </div>
                `;
            }
        }
    }

    getAvatarUrl(user, size = 128) {
        if (!user) return null;
        
        let avatarSrc = null;
        
        console.log('🖼️ Auth UI - Getting avatar for user:', {
            custom_avatar: user.custom_avatar ? 'Present' : 'None',
            avatar_source: user.avatar_source,
            discord_data: user.discord_data ? 'Present' : 'None'
        });
        
        // Priority 1: Custom uploaded avatar
        if (user.custom_avatar) {
            avatarSrc = user.custom_avatar;
            console.log('🖼️ Auth UI - Using custom uploaded avatar');
        }
        // Priority 2: Discord CDN avatar (if we have avatar hash and user ID)
        else if (user.discord_data && user.discord_data.avatar && user.discord_data.id) {
            avatarSrc = `https://cdn.discordapp.com/avatars/${user.discord_data.id}/${user.discord_data.avatar}.png?size=${size}`;
            console.log('🖼️ Auth UI - Using Discord CDN avatar');
        }
        // Priority 3: Default Discord avatar (using user ID for default)
        else if (user.discord_data && user.discord_data.id) {
            const defaultAvatarIndex = (BigInt(user.discord_data.id) >> BigInt(22)) % BigInt(6);
            avatarSrc = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
            console.log('🖼️ Auth UI - Using Discord default avatar');
        }
        // Priority 4: Stored avatar URL
        else if (user.avatar) {
            avatarSrc = user.avatar;
            console.log('🖼️ Auth UI - Using stored avatar');
        }
        // Priority 5: Generated avatar fallback
        else {
            const userName = user.display_name || user.name || 'User';
            avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=5865f2&color=fff&size=${size}&font-size=0.33&length=2&bold=true`;
            console.log('🖼️ Auth UI - Using generated avatar');
        }
        
        return avatarSrc;
    }

    // Method to refresh avatar display across the entire app
    refreshAvatarDisplay() {
        console.log('🔄 Refreshing avatar display across app...');
        
        // Update navigation avatar
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar && this.currentUser) {
            const avatarSrc = this.getAvatarUrl(this.currentUser, 48);
            userAvatar.src = avatarSrc;
            userAvatar.onerror = () => {
                const fallbackName = this.currentUser.display_name || this.currentUser.name || 'User';
                userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=5865f2&color=fff&size=48&font-size=0.33&length=2&bold=true`;
            };
        }
        
        // Update dashboard avatar if dashboard is available
        if (window.dashboard && window.dashboard.updateProfileOverview) {
            window.dashboard.updateProfileOverview();
        }
        
        console.log('✅ Avatar display refreshed');
    }

    logout() {
        // Clear user data
        this.currentUser = null;
        this.authState = 'logged-out';
        
        // Clear all authentication-related localStorage data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authState');
        localStorage.removeItem('gc_current_user');
        
        // Clear session data
        this.clearSession();
        
        // Update UI to show logged-out state
        const loggedOutNav = document.getElementById('nav-auth-logged-out');
        const loggedInNav = document.getElementById('nav-auth-logged-in');
        
        if (loggedOutNav) loggedOutNav.style.display = 'flex';
        if (loggedInNav) loggedInNav.style.display = 'none';
        
        // Hide any open dropdowns
        const dropdown = document.querySelector('.dropdown-menu');
        if (dropdown) dropdown.classList.remove('show');
        
        // Clear additional auth data
        localStorage.removeItem('discord_auth_started');
        
        if (window.localData) {
            window.localData.clearUser();
        }
        
        console.log('🔓 User logged out successfully');
        
        // Redirect to home page
        window.location.href = 'index.html';
    }

    showError(message) {
        // Create error toast notification
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Create success toast notification
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Get current user for other scripts
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Show profile setup modal after successful Discord authentication
    showProfileSetup(user = null) {
        const userData = user || this.currentUser;
        console.log('Showing profile setup for user:', userData);
        
        if (window.profileSetup) {
            window.profileSetup.show(userData);
        } else {
            // If profile setup isn't loaded yet, wait for it
            console.log('⏳ Waiting for profile setup to load...');
            let attempts = 0;
            const checkProfileSetup = () => {
                attempts++;
                if (window.profileSetup) {
                    console.log('✅ Profile setup loaded, showing now...');
                    window.profileSetup.show(userData);
                } else if (attempts < 50) {
                    setTimeout(checkProfileSetup, 100);
                } else {
                    console.error('❌ Profile setup failed to load');
                    alert('Profile setup is required. Please refresh the page to continue.');
                }
            };
            checkProfileSetup();
        }
    }

    // Force clear all data - useful for debugging
    forceClear() {
        console.log('🧹 Force clearing all authentication data...');
        
        // Clear all possible localStorage keys
        const keysToRemove = [
            'currentUser', 'authState', 'gc_current_user', 
            'discord_auth_started', 'gc_users', 'gc_servers', 
            'gc_reviews', 'gc_profiles'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Reset auth state
        this.currentUser = null;
        this.authState = 'logged-out';
        
        // Update UI
        this.updateAuthUI();
        
        console.log('✅ All data cleared. Redirecting to home...');
        
        // Reload page to start fresh
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Make force clear available globally for debugging
    window.forceClearAuth = () => {
        if (window.authManager) {
            window.authManager.forceClear();
        } else {
            console.log('🧹 Force clearing via direct method...');
            localStorage.clear();
            window.location.href = 'index.html';
        }
    };
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}