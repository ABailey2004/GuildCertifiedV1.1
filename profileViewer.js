// ProfileViewer class for displaying public user profiles
export class ProfileViewer {
    constructor() {
        this.currentProfile = null;
        this.profileId = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Share profile button
        document.getElementById('share-profile-btn')?.addEventListener('click', () => {
            this.showShareModal();
        });

        // Share modal events
        document.getElementById('share-modal-close')?.addEventListener('click', () => {
            this.hideShareModal();
        });

        document.getElementById('copy-url-btn')?.addEventListener('click', () => {
            this.copyProfileURL();
        });

        // Social share buttons
        document.getElementById('share-twitter')?.addEventListener('click', () => {
            this.shareToSocial('twitter');
        });

        document.getElementById('share-facebook')?.addEventListener('click', () => {
            this.shareToSocial('facebook');
        });

        document.getElementById('share-discord')?.addEventListener('click', () => {
            this.shareToSocial('discord');
        });

        document.getElementById('share-reddit')?.addEventListener('click', () => {
            this.shareToSocial('reddit');
        });

        // Close modal on backdrop click
        document.getElementById('share-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'share-modal') {
                this.hideShareModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideShareModal();
            }
        });
    }

    loadProfileFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user') || urlParams.get('id');
        
        console.log('🔗 Profile URL params - userId:', userId);
        
        if (userId) {
            this.profileId = userId;
            this.loadProfile(userId);
        } else {
            // No user ID provided - show current user's profile if logged in
            console.log('📄 No user ID in URL, loading current user profile');
            this.loadCurrentUserProfile();
        }
    }

    async loadCurrentUserProfile() {
        try {
            // Check if user is logged in
            const currentUser = this.getCurrentUser();
            
            if (currentUser) {
                console.log('✅ Using current user for profile display');
                // Try different ID fields
                const userId = currentUser.id || currentUser.discord_id || currentUser.user_id;
                
                if (userId) {
                    this.profileId = userId;
                    this.loadProfile(userId);
                } else {
                    this.showProfileNotFound('User found but no valid ID. Please try logging out and back in.');
                }
            } else {
                // No user logged in and no ID provided
                this.showProfileNotFound('No profile specified. Please provide a user ID or log in to view your profile.');
            }
        } catch (error) {
            console.error('Error loading current user profile:', error);
            this.showProfileNotFound('Error loading profile.');
        }
    }

    getCurrentUser() {
        // Try authManager first
        if (window.authManager && window.authManager.currentUser) {
            return window.authManager.currentUser;
        }
        
        // Try localStorage currentUser
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (e) {
                console.warn('Invalid stored user data in currentUser');
            }
        }

        // Try localData manager
        if (window.localData && window.localData.getUser) {
            const localUser = window.localData.getUser();
            if (localUser) {
                return localUser;
            }
        }

        // Try gc_current_user as fallback
        const gcUser = localStorage.getItem('gc_current_user');
        if (gcUser) {
            try {
                return JSON.parse(gcUser);
            } catch (e) {
                console.warn('Invalid stored user data in gc_current_user');
            }
        }

        return null;
    }

    async loadProfile(userId) {
        try {
            this.showLoading(true);
            console.log('📂 Loading profile for user ID:', userId);
            
            // Get user data from local storage
            let userData = this.getUserById(userId);
            
            // If no user found by ID, but we have a current user, use that
            if (!userData) {
                console.log('⚠️ No user found by ID, checking current user as fallback...');
                const currentUser = this.getCurrentUser();
                if (currentUser) {
                    console.log('✅ Using current user for profile display');
                    userData = currentUser;
                    // If no specific user ID requested, show current user
                    console.log('✅ No specific user requested, showing current user');
                    userData = currentUser;
                    this.profileId = currentUser.id || currentUser.discord_id;
                }
            }
            
            if (!userData) {
                console.error('❌ No profile data found');
                this.showProfileNotFound('Profile not found. Please make sure you are logged in or the profile URL is correct.');
                return;
            }

            console.log('✅ Profile data loaded successfully:', userData);
            this.currentProfile = userData;
            this.displayProfile(userData);
            this.updateMetaTags(userData);
            this.checkIfOwnsProfile(userData);
            
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showProfileNotFound('Error loading profile data.');
        }
    }

    getUserById(userId) {
        // Check local storage for users
        try {
            console.log('🔍 Looking for user ID:', userId);
            
            // First check current user directly (most reliable for current user's profile)
            const currentUser = this.getCurrentUser();
            if (currentUser) {
                const currentUserId = currentUser.id || currentUser.discord_id || currentUser.user_id;
                if (String(currentUserId) === String(userId)) {
                    console.log('✅ Found current user matches requested ID');
                    return currentUser;
                }
            }
            
            // Check gc_users array
            const users = JSON.parse(localStorage.getItem('gc_users') || '[]');
            console.log('📊 Available users in gc_users:', users.length, 'users');
            
            let user = users.find(u => {
                const matches = String(u.id) === String(userId) || 
                               String(u.discord_id) === String(userId) || 
                               String(u.user_id) === String(userId);
                return matches;
            });
            
            if (user) {
                console.log('✅ Found user in gc_users array');
                return user;
            }
            
            // Also check current user if no match in users array
            if (!user && currentUser) {
                console.log('❌ No user found in gc_users, using current user as fallback...');
                const currentUser = this.getCurrentUser();
                console.log('👤 Current user data:', currentUser);
                
                if (currentUser && (currentUser.id === userId || currentUser.discord_id === userId)) {
                    user = currentUser;
                    console.log('✅ Found matching current user');
                }
            } else {
                console.log('✅ Found user in gc_users:', user);
            }
            
            // Additional fallback - check all localStorage keys for user data
            if (!user) {
                console.log('🔍 Checking additional localStorage keys...');
                const currentUserStr = localStorage.getItem('currentUser');
                if (currentUserStr) {
                    try {
                        const currentUser = JSON.parse(currentUserStr);
                        console.log('📁 currentUser localStorage:', currentUser);
                        if (currentUser && (currentUser.id === userId || currentUser.discord_id === userId)) {
                            user = currentUser;
                            console.log('✅ Found user in currentUser localStorage');
                        }
                    } catch (e) {
                        console.warn('Invalid currentUser data in localStorage');
                    }
                }
            }
            
            return user;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    }

    displayProfile(userData) {
        this.showLoading(false);
        
        // Profile avatar
        const avatar = this.getAvatarUrl(userData);
        document.getElementById('profile-avatar').src = avatar;
        
        // Username and type
        document.getElementById('profile-username').textContent = 
            userData.displayName || userData.name || 'Unknown User';
        
        const profileType = document.getElementById('profile-type');
        const typeIcon = userData.profileType === 'individual' ? 'fa-user' : 'fa-server';
        const typeText = userData.profileType === 'individual' ? 'Individual User' : 'Development Studio';
        profileType.innerHTML = `<i class="fas ${typeIcon}"></i><span>${typeText}</span>`;
        
        // Join date
        const joinDate = this.formatJoinDate(userData.created || userData.joinDate);
        document.getElementById('profile-join-date').textContent = joinDate;
        
        // Verified badge
        if (userData.isVerified) {
            document.getElementById('profile-verified').style.display = 'flex';
        }
        
        // Description
        const description = userData.description || userData.bio || 'No description provided.';
        document.getElementById('profile-description').innerHTML = `<p>${this.escapeHtml(description)}</p>`;
        
        // Social links
        this.displaySocialLinks(userData.social_links || {});
        
        // Statistics (mock data for now)
        this.displayStatistics(userData);
        
        // Reviews (placeholder)
        this.displayReviews(userData);
        
        // User servers
        this.displayUserServers(userData);
        
        // Show profile content
        document.getElementById('profile-content').style.display = 'block';
        
        // Update page title
        document.title = `${userData.displayName || userData.name} - GuildCertified`;
    }

    getAvatarUrl(userData) {
        // Use custom avatar if available
        if (userData.custom_avatar) {
            return userData.custom_avatar;
        }
        
        // Use Discord avatar
        if (userData.avatar && userData.avatar.includes('cdn.discordapp.com')) {
            return userData.avatar;
        }
        
        // Use generated avatar
        if (userData.avatar && userData.avatar.includes('ui-avatars.com')) {
            return userData.avatar;
        }
        
        // Fallback to generated avatar
        const name = encodeURIComponent(userData.displayName || userData.name || 'User');
        return `https://ui-avatars.com/api/?name=${name}&background=007cba&color=ffffff&size=120&font-size=0.33&length=2&bold=true`;
    }

    formatJoinDate(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
            });
        } catch (error) {
            return 'Unknown';
        }
    }

    displaySocialLinks(socialLinks) {
        const container = document.getElementById('profile-social-links');
        container.innerHTML = '';
        
        if (!socialLinks || Object.keys(socialLinks).length === 0) {
            return;
        }
        
        Object.entries(socialLinks).forEach(([platform, url]) => {
            const link = this.createSocialLink(platform, url);
            if (link) {
                container.appendChild(link);
            }
        });
    }

    createSocialLink(platform, url) {
        const linkEl = document.createElement('a');
        linkEl.className = 'social-link';
        linkEl.href = url;
        linkEl.target = '_blank';
        linkEl.rel = 'noopener noreferrer';
        
        const icons = {
            website: 'fas fa-globe',
            discord: 'fab fa-discord',
            twitter: 'fab fa-twitter',
            instagram: 'fab fa-instagram',
            youtube: 'fab fa-youtube',
            twitch: 'fab fa-twitch',
            github: 'fab fa-github',
            linkedin: 'fab fa-linkedin',
            tiktok: 'fab fa-tiktok',
            reddit: 'fab fa-reddit-alien'
        };
        
        const icon = icons[platform.toLowerCase()] || 'fas fa-link';
        const displayName = platform.charAt(0).toUpperCase() + platform.slice(1);
        
        linkEl.innerHTML = `<i class="${icon}"></i><span>${displayName}</span>`;
        
        return linkEl;
    }

    displayStatistics(userData) {
        // Get user's servers from localStorage
        const allServers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
        const userId = userData.id || userData.discord_id || userData.user_id;
        const userServers = allServers.filter(server => 
            server.ownerId === userId || 
            server.ownerId === userData.id || 
            server.ownerId === userData.discord_id
        );
        
        // Calculate reviews given by this user
        let reviewsGiven = 0;
        let totalRatingsGiven = 0;
        
        // Check all server reviews to find reviews by this user
        allServers.forEach(server => {
            const serverReviews = JSON.parse(localStorage.getItem(`reviews_${server.id}`) || '[]');
            const userReviews = serverReviews.filter(review => 
                review.userId === userId || 
                review.userId === userData.id || 
                review.userId === userData.discord_id ||
                review.username === userData.name ||
                review.username === userData.display_name ||
                review.username === userData.displayName
            );
            
            reviewsGiven += userReviews.length;
            totalRatingsGiven += userReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        });
        
        // Calculate average rating given by this user
        const averageRating = reviewsGiven > 0 ? (totalRatingsGiven / reviewsGiven) : 0;
        
        // For profile views, show the number of reviews given as requested by user
        // If user has 10 reviews, profile views should show 10, not a decimal
        let profileViews = reviewsGiven;
        
        // Increment views if this is not the profile owner viewing their own profile
        const currentUser = this.getCurrentUser();
        const isOwnProfile = currentUser && (
            currentUser.id === userId || 
            currentUser.discord_id === userId || 
            String(currentUser.id) === String(userId) || 
            String(currentUser.discord_id) === String(userId)
        );
        
        console.log('📊 Profile Statistics:', {
            reviewsGiven,
            serversOwned: userServers.length,
            profileViews,
            averageRating: averageRating.toFixed(1),
            isOwnProfile
        });
        
        // Display statistics - ensure proper alignment of numbers with labels
        const reviewsCountEl = document.getElementById('reviews-count');
        const serversOwnedEl = document.getElementById('servers-owned-count');
        const profileViewsEl = document.getElementById('profile-views-count');
        const averageRatingEl = document.getElementById('average-rating');
        
        if (reviewsCountEl) reviewsCountEl.textContent = reviewsGiven;
        if (serversOwnedEl) serversOwnedEl.textContent = userServers.length;
        if (profileViewsEl) profileViewsEl.textContent = profileViews;
        if (averageRatingEl) {
            // Show whole numbers when possible, otherwise show 1 decimal place
            const formattedRating = averageRating % 1 === 0 ? averageRating.toString() : averageRating.toFixed(1);
            averageRatingEl.textContent = formattedRating;
        }
    }

    displayUserServers(userData) {
        const container = document.getElementById('profile-servers-container');
        
        // Get user's servers from localStorage
        const allServers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
        const userId = userData.id || userData.discord_id || userData.user_id;
        const userServers = allServers.filter(server => 
            server.ownerId === userId || 
            server.ownerId === userData.id || 
            server.ownerId === userData.discord_id
        );
        
        console.log('User servers found:', userServers);
        
        if (userServers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-server"></i>
                    <p>No servers set up yet</p>
                </div>
            `;
            return;
        }
        
        // Render user servers
        container.innerHTML = userServers.map(server => `
            <div class="server-card" style="margin-block-end: 1rem;">
                <div class="server-header">
                    <div class="server-info">
                        <h4>${this.escapeHtml(server.name)}</h4>
                        <span class="server-category">${this.escapeHtml(server.category)}</span>
                    </div>
                    <div class="server-actions">
                        <a href="server-details.html?id=${encodeURIComponent(server.id)}" class="btn btn-sm btn-secondary">
                            <i class="fas fa-eye"></i> View Details
                        </a>
                        <a href="${server.inviteLink}" target="_blank" class="btn btn-sm btn-primary">
                            <i class="fab fa-discord"></i> Join
                        </a>
                    </div>
                </div>
                <p class="server-description">${this.escapeHtml(server.description)}</p>
                ${server.tags && server.tags.length > 0 ? `
                    <div class="server-tags">
                        ${server.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="server-meta">
                    <small><i class="fas fa-calendar"></i> Created ${this.formatDate(server.created)}</small>
                    ${server.isPublic ? '<small><i class="fas fa-globe"></i> Public</small>' : '<small><i class="fas fa-lock"></i> Private</small>'}
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    displayReviews(userData) {
        const container = document.getElementById('profile-reviews-container');
        
        // Get all server reviews by this user
        const allServers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
        const userId = userData.id || userData.discord_id || userData.user_id;
        let userReviews = [];
        
        // Collect all reviews by this user across all servers
        allServers.forEach(server => {
            const serverReviews = JSON.parse(localStorage.getItem(`reviews_${server.id}`) || '[]');
            const reviewsByUser = serverReviews.filter(review => 
                review.userId === userId || 
                review.userId === userData.id || 
                review.userId === userData.discord_id ||
                review.username === userData.name ||
                review.username === userData.display_name ||
                review.username === userData.displayName
            ).map(review => ({
                ...review,
                serverName: server.name,
                serverId: server.id
            }));
            
            userReviews.push(...reviewsByUser);
        });
        
        // Sort reviews by date (newest first)
        userReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('📝 Found reviews by user:', userReviews.length);
        
        if (userReviews.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star-half-alt"></i>
                    <p>No reviews yet</p>
                </div>
            `;
            return;
        }
        
        // Display recent reviews (limit to 5 for profile page)
        const recentReviews = userReviews.slice(0, 5);
        container.innerHTML = recentReviews.map(review => `
            <div class="review-card" style="margin-block-end: 1rem;">
                <div class="review-header">
                    <div class="review-server-info">
                        <strong><a href="server-details.html?id=${encodeURIComponent(review.serverId)}" style="color: #5865f2; text-decoration: none;">
                            ${this.escapeHtml(review.serverName)}
                        </a></strong>
                        <div class="review-rating">
                            ${this.generateStarRating(review.rating)}
                        </div>
                    </div>
                    <span class="review-date">${this.formatReviewDate(review.date)}</span>
                </div>
                <p class="review-text">${this.escapeHtml(review.text)}</p>
            </div>
        `).join('');
        
        // Add "View All" link if there are more reviews
        if (userReviews.length > 5) {
            container.innerHTML += `
                <div style="text-align: center; margin-block-start: 1rem;">
                    <a href="#" class="btn btn-outline btn-sm" onclick="alert('View all reviews feature coming soon!')">
                        <i class="fas fa-ellipsis-h"></i> View All ${userReviews.length} Reviews
                    </a>
                </div>
            `;
        }
    }

    checkIfOwnsProfile(userData) {
        const currentUser = this.getCurrentUser();
        const editSection = document.getElementById('edit-profile-section');
        
        if (currentUser && (currentUser.id === userData.id || currentUser.discord_id === userData.id)) {
            editSection.style.display = 'block';
        }
    }

    showLoading(show) {
        document.getElementById('profile-loading').style.display = show ? 'flex' : 'none';
        document.getElementById('profile-content').style.display = show ? 'none' : 'block';
        document.getElementById('profile-not-found').style.display = 'none';
    }

    showProfileNotFound(message = 'Profile not found.') {
        document.getElementById('profile-loading').style.display = 'none';
        document.getElementById('profile-content').style.display = 'none';
        
        const notFoundEl = document.getElementById('profile-not-found');
        notFoundEl.querySelector('p').textContent = message;
        notFoundEl.style.display = 'flex';
    }

    updateMetaTags(userData) {
        const username = userData.displayName || userData.name || 'Unknown User';
        const description = userData.description || userData.bio || 'Check out this profile on GuildCertified';
        const avatar = this.getAvatarUrl(userData);
        const profileUrl = `${window.location.origin}${window.location.pathname}?user=${userData.id}`;
        
        document.getElementById('og-title').setAttribute('content', `${username} - GuildCertified`);
        document.getElementById('og-description').setAttribute('content', description);
        document.getElementById('og-image').setAttribute('content', avatar);
        document.getElementById('og-url').setAttribute('content', profileUrl);
    }

    showShareModal() {
        const modal = document.getElementById('share-modal');
        const urlInput = document.getElementById('profile-url-input');
        
        const profileUrl = this.getProfileURL();
        urlInput.value = profileUrl;
        
        modal.style.display = 'block';
    }

    hideShareModal() {
        document.getElementById('share-modal').style.display = 'none';
    }

    getProfileURL() {
        if (this.profileId) {
            return `${window.location.origin}/profile.html?user=${this.profileId}`;
        }
        return window.location.href;
    }

    async copyProfileURL() {
        const url = this.getProfileURL();
        
        try {
            await navigator.clipboard.writeText(url);
            this.showSuccess('Profile URL copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            const input = document.getElementById('profile-url-input');
            input.select();
            document.execCommand('copy');
            this.showSuccess('Profile URL copied to clipboard!');
        }
    }

    shareToSocial(platform) {
        const profileUrl = encodeURIComponent(this.getProfileURL());
        const username = this.currentProfile ? 
            (this.currentProfile.displayName || this.currentProfile.name) : 'User';
        const text = encodeURIComponent(`Check out ${username}'s profile on GuildCertified!`);
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${text}&url=${profileUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${profileUrl}`,
            discord: `https://discord.com/channels/@me`, // Discord doesn't have direct sharing, opens DM
            reddit: `https://reddit.com/submit?title=${text}&url=${profileUrl}`
        };
        
        if (platform === 'discord') {
            // For Discord, copy URL and show instructions
            this.copyProfileURL();
            this.showSuccess('URL copied! Paste it in Discord to share.');
        } else if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    showSuccess(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            inset-block-start: 20px;
            inset-inline-end: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star" style="color: #ffd700;"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt" style="color: #ffd700;"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star" style="color: #e2e8f0;"></i>';
        }
        
        return stars;
    }

    formatReviewDate(dateString) {
        if (!dateString) return 'Unknown date';
        
        const reviewDate = new Date(dateString);
        const now = new Date();
        const diffMs = now - reviewDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}