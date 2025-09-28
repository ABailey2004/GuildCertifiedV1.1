// Dashboard functionality
class Dashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Dashboard navigation - allow access for demo purposes
        // Users can access dashboard and sign in from there if needed

        // Quick action buttons
        document.getElementById('view-public-profile')?.addEventListener('click', () => {
            this.viewPublicProfile();
        });

        document.getElementById('manage-social-links')?.addEventListener('click', () => {
            this.showManageSocialLinksModal();
        });

        document.getElementById('upload-logo')?.addEventListener('click', () => {
            this.uploadAvatar();
        });

        document.getElementById('update-description')?.addEventListener('click', () => {
            this.updateDescription();
        });

        document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
            this.editProfile();
        });

        // Avatar upload
        document.getElementById('upload-avatar')?.addEventListener('click', () => {
            this.uploadAvatar();
        });

        // Avatar reset (right-click functionality)
        document.getElementById('dashboard-avatar')?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.currentUser.custom_avatar) {
                this.showAvatarContextMenu(e);
            }
        });

        // Server setup button
        document.getElementById('setup-server-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showServerSetupModal();
        });
    }

    async show() {
        // Always check for the most recent user data from localStorage first
        const storedUser = localStorage.getItem('currentUser');
        const authState = localStorage.getItem('authState');
        
        console.log('🔍 Dashboard loading - Auth state:', authState);
        
        if (storedUser && (authState === 'logged-in' || authState === 'setup-required')) {
            console.log('📁 Loading user from localStorage...');
            this.currentUser = JSON.parse(storedUser);
            console.log('✅ User loaded from localStorage:', this.currentUser.name || this.currentUser.display_name);
        } else {
            // Fallback to auth manager
            const authManager = window.authManager;
            if (authManager && authManager.currentUser && authManager.authState === 'logged-in') {
                console.log('📁 Loading user from authManager...');
                this.currentUser = authManager.currentUser;
            } else {
                // For demo purposes, create a default user if none exists
                console.log('🔧 No user found, creating demo user...');
                this.currentUser = {
                    id: 'demo-user-123',
                    discord_id: 'demo-user-123',
                    name: 'Demo User',
                    display_name: 'Demo User',
                    avatar: null,
                    discriminator: '0001',
                    description: 'This is a demo user account for testing purposes.',
                    profileType: 'public',
                    socialLinks: {}
                };
                // Save the demo user for profile viewing
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
        }
        
        // Load dashboard data
        await this.loadDashboardData();
    }

    async loadDashboardData() {
        try {
            // Ensure we have user data before proceeding
            if (!this.currentUser) {
                console.log('No current user data available, cannot load dashboard data');
                return;
            }
            
            // Update profile overview
            this.updateProfileOverview();
            
            // Load statistics
            await this.loadStatistics();
            
            // Load recent reviews
            await this.loadRecentReviews();
            
            // Display social links
            this.displaySocialLinks();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateProfileOverview() {
        // Ensure we have current user data
        if (!this.currentUser) {
            console.log('No current user data available for profile overview');
            return;
        }

        // Debug: Log current user data structure
        console.log('🔍 Current user data for profile overview:', {
            name: this.currentUser.name,
            display_name: this.currentUser.display_name,
            profile_type: this.currentUser.profile_type,
            description: this.currentUser.description,
            avatar: this.currentUser.avatar,
            discord_data: this.currentUser.discord_data
        });

        const avatarImg = document.getElementById('dashboard-avatar');
        const nameElement = document.getElementById('dashboard-profile-name');
        const typeElement = document.getElementById('dashboard-profile-type');
        const descriptionElement = document.getElementById('dashboard-profile-description');
        const welcomeElement = document.getElementById('dashboard-welcome');

        // Handle profile avatar with priority system
        if (avatarImg) {
            let avatarSrc = null;
            let avatarSource = 'fallback';
            
            console.log('🖼️ Avatar debug - User data:', {
                custom_avatar: this.currentUser.custom_avatar ? 'Present' : 'None',
                avatar_source: this.currentUser.avatar_source,
                discord_data: this.currentUser.discord_data,
                avatar_field: this.currentUser.avatar
            });
            
            // Priority 1: Custom uploaded avatar
            if (this.currentUser.custom_avatar) {
                avatarSrc = this.currentUser.custom_avatar;
                avatarSource = 'custom-upload';
            }
            // Priority 2: Discord CDN avatar (if we have avatar hash and user ID)
            else if (this.currentUser.discord_data && this.currentUser.discord_data.avatar && this.currentUser.discord_data.id) {
                avatarSrc = `https://cdn.discordapp.com/avatars/${this.currentUser.discord_data.id}/${this.currentUser.discord_data.avatar}.png?size=128`;
                avatarSource = 'discord-cdn';
            }
            // Priority 3: Default Discord avatar (using user ID for default)
            else if (this.currentUser.discord_data && this.currentUser.discord_data.id) {
                // Discord default avatar based on user ID
                const defaultAvatarIndex = (BigInt(this.currentUser.discord_data.id) >> BigInt(22)) % BigInt(6);
                avatarSrc = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
                avatarSource = 'discord-default';
            }
            // Priority 4: Stored avatar URL
            else if (this.currentUser.avatar) {
                avatarSrc = this.currentUser.avatar;
                avatarSource = 'stored';
            }
            
            console.log(`🖼️ Using ${avatarSource} avatar`);
            
            if (avatarSrc) {
                avatarImg.src = avatarSrc;
                avatarImg.onerror = () => {
                    console.log('❌ Avatar failed to load, using generated fallback');
                    // Fallback to generated avatar
                    const userName = this.currentUser.display_name || this.currentUser.name || 'User';
                    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=5865f2&color=fff&size=128&font-size=0.33&length=2&bold=true`;
                };
            } else {
                console.log('🖼️ No avatar available, using generated avatar');
                // Use generated avatar as fallback
                const userName = this.currentUser.display_name || this.currentUser.name || 'User';
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=5865f2&color=fff&size=128&font-size=0.33&length=2&bold=true`;
            }
        }

        // Display Discord username
        if (nameElement) {
            let displayName = 'Your Name';
            
            // Priority: display_name > Discord username > name > fallback
            if (this.currentUser.display_name) {
                displayName = this.currentUser.display_name;
            } else if (this.currentUser.discord_data && this.currentUser.discord_data.username) {
                displayName = this.currentUser.discord_data.username;
            } else if (this.currentUser.name) {
                displayName = this.currentUser.name;
            }
            
            nameElement.textContent = displayName;
        }

        // Display profile type
        if (typeElement) {
            if (this.currentUser.profile_type) {
                typeElement.textContent = this.getProfileTypeDisplay(this.currentUser.profile_type);
            } else {
                typeElement.textContent = 'Discord User';
            }
        }

        // Display description with edit capability
        if (descriptionElement) {
            const description = this.currentUser.description || this.currentUser.bio || 'No description provided. Click to add one!';
            descriptionElement.textContent = description;
            
            // Make description clickable for editing
            descriptionElement.style.cursor = 'pointer';
            descriptionElement.title = 'Click to edit description';
            
            // Remove existing listeners to avoid duplicates
            descriptionElement.replaceWith(descriptionElement.cloneNode(true));
            const newDescriptionElement = document.getElementById('dashboard-profile-description');
            
            newDescriptionElement.addEventListener('click', () => {
                this.editDescription();
            });
        }

        // Update welcome message
        if (welcomeElement) {
            const userName = this.currentUser.display_name || 
                           (this.currentUser.discord_data && this.currentUser.discord_data.username) || 
                           this.currentUser.name || 'User';
            welcomeElement.textContent = `Welcome back, ${userName}! Manage your profile and see your reviews.`;
        }
    }

    // Method to refresh user data from localStorage
    refreshUserData() {
        console.log('🔄 Refreshing user data from localStorage...');
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            console.log('✅ User data refreshed:', this.currentUser);
            this.updateProfileOverview();
        } else {
            console.log('❌ No user data found in localStorage');
        }
    }

    async loadStatistics() {
        try {
            // In a real app, this would fetch from your backend
            // For demo, we'll use mock data or calculate from localStorage
            const stats = await this.calculateUserStats();
            
            document.getElementById('user-reviews-count').textContent = stats.reviewsReceived;
            document.getElementById('user-avg-rating').textContent = stats.averageRating;
            document.getElementById('profile-views').textContent = stats.profileViews;
            
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    async calculateUserStats() {
        // Return empty stats - no template numbers
        return {
            reviewsReceived: '-',
            averageRating: '-',
            profileViews: '-'
        };
    }

    async loadRecentReviews() {
        const container = document.getElementById('recent-reviews-container');
        
        try {
            // In a real app, this would fetch reviews for this user
            // For demo, we'll show mock reviews
            const reviews = this.getMockReviews();
            
            if (reviews.length === 0) {
                container.innerHTML = `
                    <div class="no-reviews">
                        <i class="fas fa-star-o"></i>
                        <p>No reviews yet. Share your profile to start receiving reviews!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = reviews.map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <a class="review-username-link" href="#" onclick="window.dashboard.viewReviewerProfile('${review.reviewer_id || review.reviewer_name}', event)">
                                ${this.escapeHtml(review.reviewer_name)}
                            </a>
                            <div class="review-rating">
                                ${this.renderStars(review.rating)}
                            </div>
                        </div>
                        <span class="review-date">${this.formatDate(review.date)}</span>
                    </div>
                    <p class="review-text">${this.escapeHtml(review.review_text)}</p>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading recent reviews:', error);
            container.innerHTML = '<p>Error loading reviews. Please try again later.</p>';
        }
    }

    getMockReviews() {
        // Return empty array - no template reviews
        return [];
    }

    displaySocialLinks() {
        const container = document.getElementById('social-links-display');
        
        // Check if currentUser exists first
        if (!this.currentUser) {
            console.log('No current user data available for social links');
            container.innerHTML = `
                <p class="no-social-links">User data not available.</p>
            `;
            return;
        }
        
        const socialLinks = this.currentUser.social_links || {};
        
        if (Object.keys(socialLinks).length === 0) {
            container.innerHTML = `
                <p class="no-social-links">No social links added yet.</p>
                <button class="btn btn-sm btn-primary" onclick="dashboard.manageSocialLinks()">
                    <i class="fas fa-plus"></i> Add Social Links
                </button>
            `;
            return;
        }

        const socialIcons = {
            discord: 'fab fa-discord',
            instagram: 'fab fa-instagram',
            youtube: 'fab fa-youtube',
            twitter: 'fab fa-twitter',
            twitch: 'fab fa-twitch',
            github: 'fab fa-github'
        };

        container.innerHTML = Object.entries(socialLinks).map(([platform, link]) => `
            <div class="social-link-item">
                <i class="${socialIcons[platform] || 'fas fa-link'}"></i>
                <span>${platform}</span>
                <a href="${this.formatSocialLink(platform, link)}" target="_blank" rel="noopener">
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `).join('');
    }

    formatSocialLink(platform, link) {
        // Format social links to full URLs if needed
        if (link.startsWith('http')) {
            return link;
        }

        const baseUrls = {
            instagram: 'https://instagram.com/',
            twitter: 'https://twitter.com/',
            youtube: 'https://youtube.com/c/',
            twitch: 'https://twitch.tv/',
            github: 'https://github.com/',
            discord: '' // Discord links are usually invites already
        };

        if (platform === 'discord') {
            return link.startsWith('discord.gg') ? `https://${link}` : link;
        }

        return baseUrls[platform] ? baseUrls[platform] + link.replace('@', '') : link;
    }

    manageSocialLinks() {
        // Open a modal to manage social links
        this.showManageSocialLinksModal();
    }

    showManageSocialLinksModal() {
        const modal = document.getElementById('social-links-modal');
        const container = document.getElementById('social-links-container');
        const addBtn = document.getElementById('add-social-link');
        const saveBtn = document.getElementById('social-save-btn');
        const cancelBtn = document.getElementById('social-cancel-btn');
        const closeBtn = document.getElementById('social-modal-close');

        // Clear container
        container.innerHTML = '';

        // Load existing links
        const currentLinks = this.currentUser.social_links || {};
        Object.entries(currentLinks).forEach(([platform, link]) => {
            this.addSocialLinkItem(container, platform, link);
        });

        // Add one empty item if no links exist
        if (Object.keys(currentLinks).length === 0) {
            this.addSocialLinkItem(container, '', '');
        }

        // Show modal
        modal.style.display = 'block';

        // Add link button handler
        const handleAddLink = () => {
            this.addSocialLinkItem(container, '', '');
        };

        // Save handler
        const handleSave = async () => {
            await this.saveSocialLinks(container);
            this.closeSocialModal(modal, addBtn, handleAddLink, handleSave, handleCancel);
        };

        // Cancel handler
        const handleCancel = () => {
            this.closeSocialModal(modal, addBtn, handleAddLink, handleSave, handleCancel);
        };

        // Bind events
        addBtn.addEventListener('click', handleAddLink);
        saveBtn.addEventListener('click', handleSave);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        });

        // Handle Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        document.addEventListener('keydown', handleEscape);
        this.socialEscapeHandler = handleEscape;
    }

    addSocialLinkItem(container, platform = '', link = '') {
        const item = document.createElement('div');
        item.className = 'social-link-item';
        item.innerHTML = `
            <select class="form-input social-platform">
                <option value="">Select Platform</option>
                <option value="website" ${platform === 'website' ? 'selected' : ''}>🌐 Website</option>
                <option value="discord" ${platform === 'discord' ? 'selected' : ''}>💬 Discord</option>
                <option value="twitter" ${platform === 'twitter' ? 'selected' : ''}>🐦 Twitter/X</option>
                <option value="instagram" ${platform === 'instagram' ? 'selected' : ''}>📸 Instagram</option>
                <option value="youtube" ${platform === 'youtube' ? 'selected' : ''}>📺 YouTube</option>
                <option value="twitch" ${platform === 'twitch' ? 'selected' : ''}>🎮 Twitch</option>
                <option value="github" ${platform === 'github' ? 'selected' : ''}>💻 GitHub</option>
                <option value="linkedin" ${platform === 'linkedin' ? 'selected' : ''}>💼 LinkedIn</option>
                <option value="tiktok" ${platform === 'tiktok' ? 'selected' : ''}>🎵 TikTok</option>
                <option value="reddit" ${platform === 'reddit' ? 'selected' : ''}>🤖 Reddit</option>
            </select>
            <input 
                type="url" 
                class="form-input social-url" 
                placeholder="https://... or @username"
                value="${link}"
            >
            <button type="button" class="social-link-remove" title="Remove link">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // Add remove functionality
        const removeBtn = item.querySelector('.social-link-remove');
        removeBtn.addEventListener('click', () => {
            item.remove();
        });

        container.appendChild(item);
    }

    async saveSocialLinks(container) {
        try {
            const socialLinks = {};
            const items = container.querySelectorAll('.social-link-item');
            
            items.forEach(item => {
                const platform = item.querySelector('.social-platform').value;
                const url = item.querySelector('.social-url').value.trim();
                
                if (platform && url) {
                    socialLinks[platform] = url;
                }
            });

            this.currentUser.social_links = socialLinks;
            await this.saveUserData();
            this.displaySocialLinks();
            this.showSuccess('Social links updated successfully!');
            
        } catch (error) {
            console.error('Error updating social links:', error);
            this.showError('Failed to update social links. Please try again.');
        }
    }

    closeSocialModal(modal, addBtn, addHandler, saveHandler, cancelHandler) {
        // Remove event listeners
        addBtn.removeEventListener('click', addHandler);
        document.getElementById('social-save-btn').removeEventListener('click', saveHandler);
        document.getElementById('social-cancel-btn').removeEventListener('click', cancelHandler);
        document.getElementById('social-modal-close').removeEventListener('click', cancelHandler);
        
        // Remove escape handler
        if (this.socialEscapeHandler) {
            document.removeEventListener('keydown', this.socialEscapeHandler);
            this.socialEscapeHandler = null;
        }

        // Hide modal
        modal.style.display = 'none';
        
        // Clear container
        document.getElementById('social-links-container').innerHTML = '';
    }

    uploadLogo() {
        // Upload logo redirects to avatar upload for profile pictures
        this.uploadAvatar();
    }

    viewPublicProfile() {
        if (this.currentUser) {
            // Try multiple ID fields
            const userId = this.currentUser.id || this.currentUser.discord_id || this.currentUser.user_id;
            
            if (userId) {
                // Ensure the user has all required fields
                const userToSave = {
                    ...this.currentUser,
                    id: userId,
                    discord_id: userId,
                    user_id: userId
                };
                
                // Save user data in multiple locations for reliability
                localStorage.setItem('currentUser', JSON.stringify(userToSave));
                localStorage.setItem('gc_current_user', JSON.stringify(userToSave));
                
                if (window.localData && window.localData.saveUser) {
                    window.localData.saveUser(userToSave);
                }
                
                console.log('✅ User data saved for profile viewing:', userToSave);
                
                // Navigate to public profile page in the same tab
                const profileUrl = `profile.html?user=${userId}`;
                window.location.href = profileUrl;
            } else {
                this.showError('Unable to determine user ID. Please try logging out and back in.');
            }
        } else {
            this.showError('Unable to view profile. Please make sure you are logged in.');
        }
    }

    uploadAvatar() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleAvatarUpload(file);
            }
        });
        
        // Trigger file selection
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    async handleAvatarUpload(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }
        
        // Check file size (limit to 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showError('Image file is too large. Please select an image under 5MB.');
            return;
        }
        
        try {
            // Convert image to base64 for storage
            const imageDataURL = await this.fileToDataURL(file);
            
            // Optionally resize the image
            const resizedImage = await this.resizeImage(imageDataURL, 300, 300);
            
            // Update user data with new avatar
            this.currentUser.custom_avatar = resizedImage;
            this.currentUser.avatar_source = 'custom';
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Update auth manager if available
            if (window.authManager) {
                window.authManager.currentUser = this.currentUser;
                // Refresh avatar display across the entire app
                window.authManager.refreshAvatarDisplay();
            }
            
            // Update localData if available
            if (window.localData && window.localData.saveUser) {
                window.localData.saveUser(this.currentUser);
            }
            
            this.showSuccess('Profile picture updated successfully!');
            
            console.log('✅ Avatar uploaded and saved');
            
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showError('Failed to upload avatar. Please try again.');
        }
    }

    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    resizeImage(dataURL, maxWidth, maxHeight) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = width * (maxHeight / height);
                        height = maxHeight;
                    }
                }
                
                // Set canvas size and draw image
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert back to data URL
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            
            img.src = dataURL;
        });
    }

    showAvatarContextMenu(e) {
        const menu = document.createElement('div');
        menu.className = 'avatar-context-menu';
        menu.style.cssText = `
            position: fixed;
            inset-block-start: ${e.clientY}px;
            inset-inline-start: ${e.clientX}px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            overflow: hidden;
        `;
        
        const uploadOption = document.createElement('div');
        uploadOption.textContent = '📷 Change Photo';
        uploadOption.className = 'context-menu-item';
        
        const removeOption = document.createElement('div');
        removeOption.textContent = '🗑️ Remove Custom Photo';
        removeOption.className = 'context-menu-item';
        
        // Add CSS for menu items
        [uploadOption, removeOption].forEach(item => {
            item.style.cssText = `
                padding: 0.75rem 1rem;
                cursor: pointer;
                transition: background 0.3s;
                font-size: 0.9rem;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.background = '#f8fafc';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = '';
            });
        });
        
        uploadOption.addEventListener('click', () => {
            this.uploadAvatar();
            document.body.removeChild(menu);
        });
        
        removeOption.addEventListener('click', () => {
            this.removeCustomAvatar();
            document.body.removeChild(menu);
        });
        
        menu.appendChild(uploadOption);
        menu.appendChild(removeOption);
        document.body.appendChild(menu);
        
        // Remove menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                if (document.body.contains(menu)) {
                    document.body.removeChild(menu);
                }
                document.removeEventListener('click', removeMenu);
            });
        }, 0);
    }

    removeCustomAvatar() {
        if (confirm('Remove your custom profile picture? This will revert to your Discord avatar or generated avatar.')) {
            delete this.currentUser.custom_avatar;
            delete this.currentUser.avatar_source;
            
            // Save updated user data
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            if (window.authManager) {
                window.authManager.currentUser = this.currentUser;
                // Refresh avatar display across the entire app
                window.authManager.refreshAvatarDisplay();
            }
            
            if (window.localData && window.localData.saveUser) {
                window.localData.saveUser(this.currentUser);
            }
            
            this.showSuccess('Custom profile picture removed!');
        }
    }

    editProfile() {
        // Open profile editing modal
        alert('Profile editing modal coming soon! You\'ll be able to edit all your profile information.');
    }

    async saveUserData() {
        try {
            if (window.auth) {
                await window.auth.saveUserData();
                window.auth.saveAuthState();
            }
        } catch (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let starsHtml = '';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHtml += '<i class="fas fa-star star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                starsHtml += '<i class="fas fa-star-half-alt star"></i>';
            } else {
                starsHtml += '<i class="fas fa-star star empty"></i>';
            }
        }

        return starsHtml;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    viewReviewerProfile(userIdOrUsername, event) {
        event.preventDefault();
        
        console.log('📱 Dashboard - Viewing profile for:', userIdOrUsername);
        
        // Try to find the user by ID first, then by username
        let userId = userIdOrUsername;
        
        // If it looks like a username rather than an ID, try to find the actual user ID
        if (typeof userIdOrUsername === 'string' && !userIdOrUsername.includes('user_') && !userIdOrUsername.includes('-')) {
            // Search for user by username in localStorage
            const users = JSON.parse(localStorage.getItem('gc_users') || '[]');
            const foundUser = users.find(user => 
                user.name === userIdOrUsername || 
                user.display_name === userIdOrUsername ||
                user.displayName === userIdOrUsername ||
                user.username === userIdOrUsername
            );
            
            if (foundUser) {
                userId = foundUser.id || foundUser.discord_id || foundUser.user_id;
                console.log('✅ Found user ID:', userId);
            } else {
                console.log('⚠️ Could not find user ID for username:', userIdOrUsername);
                // Fallback: use the username as ID
                userId = userIdOrUsername;
            }
        }
        
        // Navigate to profile page
        const profileUrl = `profile.html?user=${encodeURIComponent(userId)}`;
        console.log('🔗 Navigating to:', profileUrl);
        window.location.href = profileUrl;
    }

    updateDescription() {
        // Alias method for the quick action button
        this.editDescription();
    }

    async editDescription() {
        const currentDescription = this.currentUser.description || this.currentUser.bio || '';
        this.showDescriptionModal(currentDescription);
    }

    showDescriptionModal(currentDescription = '') {
        const modal = document.getElementById('description-edit-modal');
        const textarea = document.getElementById('description-textarea');
        const charCount = document.getElementById('char-count');
        const saveBtn = document.getElementById('description-save-btn');
        const cancelBtn = document.getElementById('description-cancel-btn');
        const closeBtn = document.getElementById('description-modal-close');

        // Set current description
        textarea.value = currentDescription;
        this.updateCharCount(textarea, charCount);

        // Show modal
        modal.style.display = 'block';
        setTimeout(() => textarea.focus(), 100);

        // Character count update
        const handleInput = () => this.updateCharCount(textarea, charCount);
        textarea.addEventListener('input', handleInput);

        // Save handler
        const handleSave = async () => {
            const newDescription = textarea.value.trim();
            if (newDescription !== currentDescription) {
                await this.saveDescription(newDescription);
            }
            this.closeDescriptionModal(modal, textarea, handleInput, handleSave, handleCancel);
        };

        // Cancel handler
        const handleCancel = () => {
            this.closeDescriptionModal(modal, textarea, handleInput, handleSave, handleCancel);
        };

        // Bind events
        saveBtn.addEventListener('click', handleSave);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        });

        // Handle Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Store escape handler for cleanup
        this.escapeHandler = handleEscape;
    }

    updateCharCount(textarea, charCountEl) {
        const count = textarea.value.length;
        const maxLength = 500;
        charCountEl.textContent = count;
        
        // Update styling based on character count
        charCountEl.parentElement.className = 'character-count';
        if (count > maxLength * 0.9) {
            charCountEl.parentElement.classList.add('warning');
        }
        if (count >= maxLength) {
            charCountEl.parentElement.classList.add('error');
        }
    }

    async saveDescription(newDescription) {
        try {
            // Update the user object
            this.currentUser.description = newDescription;
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Update auth manager if available
            if (window.authManager) {
                window.authManager.currentUser = this.currentUser;
            }
            
            // Update localData if available
            if (window.localData && window.localData.saveUser) {
                window.localData.saveUser(this.currentUser);
            }
            
            // Refresh the profile overview to show the new description
            this.updateProfileOverview();
            
            this.showSuccess('Description updated successfully!');
            console.log('✅ Description updated:', newDescription);
            
        } catch (error) {
            console.error('Error updating description:', error);
            this.showError('Failed to update description. Please try again.');
        }
    }

    closeDescriptionModal(modal, textarea, inputHandler, saveHandler, cancelHandler) {
        // Remove event listeners
        textarea.removeEventListener('input', inputHandler);
        document.getElementById('description-save-btn').removeEventListener('click', saveHandler);
        document.getElementById('description-cancel-btn').removeEventListener('click', cancelHandler);
        document.getElementById('description-modal-close').removeEventListener('click', cancelHandler);
        
        // Remove escape handler
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }

        // Hide modal
        modal.style.display = 'none';
        
        // Clear textarea
        textarea.value = '';
    }

    getProfileTypeDisplay(type) {
        const types = {
            'discord-server': 'Discord Server',
            'company': 'Company',
            'store': 'Store/Shop',
            'dev-studio': 'Development Studio',
            'content-creator': 'Content Creator',
            'individual': 'Individual'
        };
        return types[type] || type;
    }

    showSuccess(message) {
        console.log('Success:', message);
        
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Remove the toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showError(message) {
        console.error('Error:', message);
        
        // Create an error toast notification
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Remove the toast after 4 seconds (longer for errors)
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // Server Setup Modal Methods
    showServerSetupModal() {
        // Check server limit before showing modal
        if (this.checkServerLimit()) {
            return; // Don't show modal if limit reached
        }
        
        const modal = document.getElementById('server-setup-modal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Reset modal to first step
        this.resetServerSetupModal();
        
        // Bind server setup events
        this.bindServerSetupEvents();
    }
    
    checkServerLimit() {
        // Get user's servers from localStorage
        const allServers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
        const userServers = allServers.filter(server => {
            return server.ownerId === this.currentUser.id || 
                   server.ownerId === this.currentUser.discord_id || 
                   server.owner === this.currentUser.name ||
                   server.owner === this.currentUser.display_name;
        });
        
        console.log(`User has ${userServers.length} servers out of 3 allowed`);
        
        if (userServers.length >= 3) {
            // Show limit reached popup
            this.showServerLimitPopup();
            return true; // Limit reached
        }
        
        return false; // Under limit
    }
    
    showServerLimitPopup() {
        const popup = document.createElement('div');
        popup.className = 'server-limit-popup';
        popup.innerHTML = `
            <div class="popup-overlay">
                <div class="popup-content">
                    <div class="popup-icon">
                        <i class="fas fa-server" style="color: #5865f2; font-size: 2rem;"></i>
                    </div>
                    <h3>Server Limit Reached</h3>
                    <p>At this time, we are only allowing users to create <strong>3 servers</strong>.</p>
                    <p><strong>Coming soon:</strong> You will be able to create <strong>10+ servers</strong>!</p>
                    <div class="popup-actions">
                        <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">Got it!</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add popup to body
        document.body.appendChild(popup);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 10000);
    }

    resetServerSetupModal() {
        // Show first step, hide others
        document.querySelectorAll('.setup-step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById('server-basic-info').classList.add('active');
        
        // Reset navigation
        document.getElementById('server-prev-btn').style.display = 'none';
        document.getElementById('server-next-btn').style.display = 'inline-flex';
        document.getElementById('server-submit-btn').style.display = 'none';
        document.getElementById('current-step').textContent = '1';
        document.querySelector('.progress-fill').style.width = '50%';
        
        // Clear form
        document.getElementById('server-setup-modal').querySelectorAll('input, textarea, select').forEach(field => {
            if (field.type !== 'checkbox') {
                field.value = '';
            } else {
                field.checked = field.id === 'server-public'; // Keep public checked by default
            }
        });
        
        // Reset logo preview
        const logoPreview = document.getElementById('server-logo-preview');
        if (logoPreview) {
            logoPreview.innerHTML = `
                <i class="fas fa-image"></i>
                <span>No logo selected</span>
            `;
            logoPreview.classList.remove('has-image');
        }
        
        // Reset character counts
        this.updateCharacterCount('server-description', 'description-count', 500);
        this.updateCharacterCount('server-rules', 'rules-count', 1000);
    }

    bindServerSetupEvents() {
        // Prevent multiple event bindings
        const nextBtn = document.getElementById('server-next-btn');
        const prevBtn = document.getElementById('server-prev-btn');
        const submitBtn = document.getElementById('server-submit-btn');
        
        // Remove existing listeners by cloning
        const newNextBtn = nextBtn.cloneNode(true);
        const newPrevBtn = prevBtn.cloneNode(true);
        const newSubmitBtn = submitBtn.cloneNode(true);
        
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        // Add new listeners
        newNextBtn.addEventListener('click', () => this.nextServerSetupStep());
        newPrevBtn.addEventListener('click', () => this.prevServerSetupStep());
        newSubmitBtn.addEventListener('click', () => this.submitServerSetup());
        
        // Character count listeners
        document.getElementById('server-description').addEventListener('input', (e) => {
            this.updateCharacterCount('server-description', 'description-count', 500);
        });
        
        document.getElementById('server-rules').addEventListener('input', (e) => {
            this.updateCharacterCount('server-rules', 'rules-count', 1000);
        });
        
        // Server logo preview
        document.getElementById('server-logo').addEventListener('change', (e) => {
            this.previewServerLogo(e);
        });
    }

    nextServerSetupStep() {
        // Validate current step
        if (!this.validateCurrentStep()) {
            return;
        }
        
        // Move to step 2
        document.getElementById('server-basic-info').classList.remove('active');
        document.getElementById('server-additional-info').classList.add('active');
        
        // Update navigation
        document.getElementById('server-prev-btn').style.display = 'inline-flex';
        document.getElementById('server-next-btn').style.display = 'none';
        document.getElementById('server-submit-btn').style.display = 'inline-flex';
        document.getElementById('current-step').textContent = '2';
        document.querySelector('.progress-fill').style.width = '100%';
    }

    prevServerSetupStep() {
        // Move to step 1
        document.getElementById('server-additional-info').classList.remove('active');
        document.getElementById('server-basic-info').classList.add('active');
        
        // Update navigation
        document.getElementById('server-prev-btn').style.display = 'none';
        document.getElementById('server-next-btn').style.display = 'inline-flex';
        document.getElementById('server-submit-btn').style.display = 'none';
        document.getElementById('current-step').textContent = '1';
        document.querySelector('.progress-fill').style.width = '50%';
    }

    validateCurrentStep() {
        const requiredFields = [
            'server-name',
            'server-description', 
            'server-category',
            'server-invite'
        ];
        
        let isValid = true;
        
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            const value = field.value.trim();
            
            // Remove existing error styling
            field.style.borderColor = '';
            
            if (!value) {
                field.style.borderColor = '#ef4444';
                isValid = false;
            }
        }
        
        if (!isValid) {
            this.showError('Please fill in all required fields (marked with *)');
        }
        
        return isValid;
    }

    async submitServerSetup() {
        // Collect form data
        // Handle server logo upload
        let serverLogo = null;
        const logoInput = document.getElementById('server-logo');
        if (logoInput.files && logoInput.files[0]) {
            try {
                serverLogo = await this.handleServerLogoUpload(logoInput.files[0]);
            } catch (error) {
                console.error('Error uploading server logo:', error);
                // Continue without logo if upload fails
            }
        }

        const serverData = {
            name: document.getElementById('server-name').value.trim(),
            description: document.getElementById('server-description').value.trim(),
            category: document.getElementById('server-category').value,
            inviteLink: document.getElementById('server-invite').value.trim(),
            tags: document.getElementById('server-tags').value.trim().split(',').map(tag => tag.trim()).filter(tag => tag),
            rules: document.getElementById('server-rules').value.trim(),
            isPublic: document.getElementById('server-public').checked,
            ownerId: this.currentUser.id || this.currentUser.discord_id,
            ownerName: this.currentUser.name || this.currentUser.display_name,
            created: new Date().toISOString(),
            rating: 0,
            reviewCount: 0,
            memberCount: 0,
            icon: serverLogo,
            logo: serverLogo
        };
        
        try {
            // Save server data to localStorage (in real app, this would be an API call)
            await this.saveServerData(serverData);
            
            this.showSuccess('Server setup completed successfully! Your server is now live on the home page.');
            
            // Close modal properly
            const modal = document.getElementById('server-setup-modal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Redirect to home page to show the server
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } catch (error) {
            console.error('Error setting up server:', error);
            this.showError('Failed to set up server. Please try again.');
        }
    }

    async saveServerData(serverData) {
        // Get existing servers
        const servers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
        
        // Generate unique ID
        serverData.id = 'server_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Set server ownership information
        serverData.ownerId = this.currentUser.id || this.currentUser.discord_id;
        serverData.ownerName = this.currentUser.display_name || this.currentUser.name;
        serverData.owner = serverData.ownerName; // For backward compatibility
        
        // Add to servers array
        servers.push(serverData);
        
        // Save back to localStorage
        localStorage.setItem('gc_servers', JSON.stringify(servers));
        
        console.log('Server saved successfully:', serverData);
        
        // Also save to current user's servers list
        if (!this.currentUser.servers) {
            this.currentUser.servers = [];
        }
        this.currentUser.servers.push(serverData.id);
        
        // Update user data
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        if (window.localData && window.localData.saveUser) {
            window.localData.saveUser(this.currentUser);
        }
    }

    updateCharacterCount(textareaId, counterId, maxLength) {
        const textarea = document.getElementById(textareaId);
        const counter = document.getElementById(counterId);
        const currentLength = textarea.value.length;
        
        counter.textContent = currentLength;
        
        // Change color based on usage
        if (currentLength > maxLength * 0.9) {
            counter.style.color = '#ef4444'; // Red when near limit
        } else if (currentLength > maxLength * 0.7) {
            counter.style.color = '#f59e0b'; // Orange when getting close
        } else {
            counter.style.color = '#64748b'; // Normal gray
        }
    }

    previewServerLogo(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('server-logo-preview');
        
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                event.target.value = '';
                return;
            }
            
            // Validate file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image file size must be less than 2MB');
                event.target.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Server Logo Preview">`;
                preview.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        } else {
            // Reset preview
            preview.innerHTML = `
                <i class="fas fa-image"></i>
                <span>No logo selected</span>
            `;
            preview.classList.remove('has-image');
        }
    }

    async handleServerLogoUpload(file) {
        return new Promise((resolve, reject) => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                reject(new Error('Please select an image file'));
                return;
            }
            
            // Validate file size (2MB limit)
            if (file.size > 2 * 1024 * 1024) {
                reject(new Error('Image file size must be less than 2MB'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        // Create canvas to resize image
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Set canvas size (square, 256x256)
                        const size = 256;
                        canvas.width = size;
                        canvas.height = size;
                        
                        // Draw image scaled to fit
                        const minDimension = Math.min(img.width, img.height);
                        const sx = (img.width - minDimension) / 2;
                        const sy = (img.height - minDimension) / 2;
                        
                        ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, size, size);
                        
                        // Convert to base64 data URL
                        const dataUrl = canvas.toDataURL('image/png', 0.8);
                        resolve(dataUrl);
                    } catch (error) {
                        reject(new Error('Failed to process image'));
                    }
                };
                img.onerror = () => reject(new Error('Invalid image file'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    closeServerSetupModal() {
        const modal = document.getElementById('server-setup-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    
    // If we're on the dashboard page, show the dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        window.dashboard.show();
        
        // Check if server setup should be opened from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('setup-server') === 'true') {
            setTimeout(() => {
                window.dashboard.showServerSetupModal();
            }, 500); // Small delay to ensure dashboard is ready
        }
    }
});
