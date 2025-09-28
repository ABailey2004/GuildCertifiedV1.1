// Server Details Manager
class ServerDetailsManager {
    constructor() {
        this.serverId = this.getServerIdFromUrl();
        this.serverData = null;
        this.reviews = [];
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        try {
            // Give auth system time to load if needed
            await this.waitForAuthSystem();
            
            // Load current user if authenticated
            this.currentUser = await this.loadCurrentUser();
            
            if (!this.serverId) {
                this.showError("No server ID provided");
                return;
            }

            // Load server data
            await this.loadServerData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update authentication state
            this.updateAuthState();
            
            // Setup login button for non-authenticated users
            this.setupLoginButton();
            
        } catch (error) {
            console.error('Error initializing server details:', error);
            this.showError("Failed to load server details");
        }
    }

    async waitForAuthSystem() {
        // Wait a bit for auth system to initialize if not already loaded
        if (!window.authManager && !localStorage.getItem('currentUser')) {
            console.log('⏳ Waiting for auth system to load...');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    getServerIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadCurrentUser() {
        // Check localStorage for user data (same as dashboard)
        const storedUser = localStorage.getItem('currentUser');
        const authState = localStorage.getItem('authState');
        
        if (storedUser && (authState === 'logged-in' || authState === 'setup-required')) {
            console.log('✅ Server details: User loaded from localStorage');
            return JSON.parse(storedUser);
        } else {
            // Fallback to auth manager
            const authManager = window.authManager;
            if (authManager && authManager.currentUser && authManager.authState === 'logged-in') {
                console.log('✅ Server details: User loaded from authManager');
                return authManager.currentUser;
            }
        }
        
        console.log('❌ Server details: No authenticated user found');
        return null;
    }

    async loadServerData() {
        try {
            console.log('🔍 Looking for server ID:', this.serverId);
            
            // First, try to load from localStorage (user-created servers)
            const userServers = JSON.parse(localStorage.getItem('userServers') || '[]');
            console.log('📊 User servers available:', userServers.map(s => s.id));
            let server = userServers.find(s => s.id === this.serverId);
            
            if (!server) {
                // Also check gc_servers (alternative storage location)
                const gcServers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
                console.log('📊 GC servers available:', gcServers.map(s => s.id));
                server = gcServers.find(s => s.id === this.serverId);
            }
            
            if (!server) {
                // If not found in user servers, try sample data
                console.log('📊 Trying sample data...');
                server = await this.loadFromSampleData();
            }
            
            if (!server) {
                console.error('❌ Server not found with ID:', this.serverId);
                console.log('Available user servers:', userServers);
                console.log('Available GC servers:', JSON.parse(localStorage.getItem('gc_servers') || '[]'));
                this.showError("Server not found");
                return;
            }

            console.log('✅ Server found:', server);
            this.serverData = server;
            
            // Load reviews for this server
            await this.loadServerReviews();
            
            // Display the server
            this.displayServer();
            
        } catch (error) {
            console.error('Error loading server data:', error);
            this.showError("Failed to load server data");
        }
    }

    async loadFromSampleData() {
        // No sample data - return null for production use
        return null;
    }

    async loadServerReviews() {
        // Load reviews from localStorage only - no sample data
        const storedReviews = JSON.parse(localStorage.getItem(`reviews_${this.serverId}`) || '[]');
        this.reviews = storedReviews;
        
        console.log(`📊 Loaded ${this.reviews.length} reviews for server ${this.serverId}`);
        
        // Recalculate server rating based on loaded reviews
        if (this.reviews.length > 0) {
            const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
            const avgRating = totalRating / this.reviews.length;
            
            this.serverData.rating = avgRating;
            this.serverData.reviewCount = this.reviews.length;
            
            console.log(`📊 Recalculated server rating: ${avgRating.toFixed(1)} from ${this.reviews.length} reviews`);
        } else {
            this.serverData.rating = 0;
            this.serverData.reviewCount = 0;
        }
    }



    displayServer() {
        // Hide loading and show content
        document.getElementById('server-loading').style.display = 'none';
        document.getElementById('server-content').style.display = 'block';

        // Update page title
        document.title = `${this.serverData.name} - GuildCertified`;

        // Display server header information
        this.displayServerHeader();
        
        // Display server description and details
        this.displayServerDetails();
        
        // Display server statistics
        this.displayServerStats();
        
        // Display reviews
        this.displayReviews();
        
        // Display similar servers
        this.displaySimilarServers();
    }

    displayServerHeader() {
        const server = this.serverData;
        
        // Server icon
        const serverIcon = document.getElementById('server-icon');
        const iconUrl = server.icon || server.serverIcon || server.avatar;
        serverIcon.src = iconUrl || this.getDefaultServerIcon(server.name);
        serverIcon.alt = `${server.name} Icon`;

        // Server name and category
        document.getElementById('server-name').textContent = server.name;
        document.getElementById('server-category').textContent = server.category;

        // Server meta information
        document.getElementById('server-owner').textContent = server.ownerName || server.owner || server.ownerId || 'Unknown';
        document.getElementById('server-created').textContent = this.formatDate(server.createdDate || server.created);
        document.getElementById('server-members').textContent = this.formatMemberCount(server.members || 0);

        // Rating display
        this.displayRating(server.rating || 0, server.reviewCount || 0);

        // Join server button
        const joinBtn = document.getElementById('join-server-btn');
        const inviteUrl = server.inviteUrl || server.inviteLink;
        if (inviteUrl) {
            joinBtn.href = inviteUrl;
            joinBtn.style.display = 'inline-flex';
        } else {
            joinBtn.style.display = 'none';
        }

        // Share URL for modal
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${server.id}`;
        document.getElementById('share-url').value = shareUrl;
    }

    displayServerDetails() {
        const server = this.serverData;
        
        // Description
        document.getElementById('server-description').textContent = server.description || 'No description available.';

        // Tags
        const tagsContainer = document.getElementById('server-tags-container');
        if (server.tags && Array.isArray(server.tags) && server.tags.length > 0) {
            tagsContainer.innerHTML = server.tags.map(tag => 
                `<span class="tag">${this.escapeHtml(tag)}</span>`
            ).join('');
            tagsContainer.style.display = 'block';
        } else {
            tagsContainer.style.display = 'none';
        }

        // Rules
        const rulesContainer = document.getElementById('server-rules-container');
        const rulesContent = document.getElementById('server-rules-content');
        if (server.rules && Array.isArray(server.rules) && server.rules.length > 0) {
            rulesContent.innerHTML = server.rules.map((rule, index) => 
                `<div class="rule-item">
                    <span class="rule-number">${index + 1}.</span>
                    <span class="rule-text">${this.escapeHtml(rule)}</span>
                </div>`
            ).join('');
            rulesContainer.style.display = 'block';
        } else {
            rulesContainer.style.display = 'none';
        }
    }

    displayServerStats() {
        const server = this.serverData;
        
        // Basic stats
        document.getElementById('total-reviews-count').textContent = server.reviewCount || 0;
        document.getElementById('avg-rating-value').textContent = (server.rating || 0).toFixed(1);
        document.getElementById('members-count').textContent = this.formatMemberCount(server.members);
        document.getElementById('server-status').textContent = 'Active';

        // Rating breakdown
        this.displayRatingBreakdown();
    }

    displayRatingBreakdown() {
        // Calculate rating distribution from reviews
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        this.reviews.forEach(review => {
            if (review.rating >= 1 && review.rating <= 5) {
                ratingCounts[review.rating]++;
            }
        });

        const totalReviews = this.reviews.length;

        // Update rating bars
        for (let rating = 1; rating <= 5; rating++) {
            const count = ratingCounts[rating];
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            const fillElement = document.getElementById(`rating-${rating}-fill`);
            const countElement = document.getElementById(`rating-${rating}-count`);
            
            if (fillElement) fillElement.style.width = `${percentage}%`;
            if (countElement) countElement.textContent = count.toString();
        }
    }

    displayReviews() {
        const reviewsContainer = document.getElementById('reviews-container');
        
        if (this.reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="no-reviews">
                    <i class="fas fa-star"></i>
                    <h4>No reviews yet</h4>
                    <p>Be the first to review this server!</p>
                    ${this.currentUser ? '<button class="btn btn-primary" onclick="openReviewModal()">Write First Review</button>' : '<p>Please sign in to write a review.</p>'}
                </div>
            `;
            return;
        }

        // Sort reviews based on current sort option
        const sortedReviews = this.getSortedReviews();
        
        reviewsContainer.innerHTML = sortedReviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-user">
                        <img class="review-avatar" src="${review.avatar || this.getDefaultAvatar(review.username)}" alt="${review.username}">
                        <div class="review-user-info">
                            <a class="review-username-link" href="#" onclick="window.serverDetailsManager.viewReviewerProfile('${review.userId || review.username}', event)">
                                ${review.username}
                            </a>
                            <span class="review-date">${this.formatReviewDate(review.date)}</span>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${this.generateStarRating(review.rating)}
                    </div>
                </div>
                <div class="review-content">
                    <p>${review.text}</p>
                </div>
                <div class="review-actions">
                    <button class="review-action-btn ${review.helpful > 0 ? 'active' : ''}" onclick="toggleReviewHelpful('${review.id}')">
                        <i class="fas fa-thumbs-up"></i> Helpful (${review.helpful || 0})
                    </button>
                    <button class="review-action-btn" onclick="reportReview('${review.id}')">
                        <i class="fas fa-flag"></i> Report
                    </button>
                </div>
            </div>
        `).join('');
    }

    getSortedReviews() {
        const sortOption = document.getElementById('review-sort').value;
        const reviewsCopy = [...this.reviews];
        
        switch (sortOption) {
            case 'newest':
                return reviewsCopy.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'oldest':
                return reviewsCopy.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'highest':
                return reviewsCopy.sort((a, b) => b.rating - a.rating);
            case 'lowest':
                return reviewsCopy.sort((a, b) => a.rating - b.rating);
            default:
                return reviewsCopy;
        }
    }

    displaySimilarServers() {
        const similarContainer = document.getElementById('similar-servers-container');
        
        // Generate similar servers based on category
        const similarServers = this.generateSimilarServers();
        
        if (similarServers.length === 0) {
            similarContainer.innerHTML = '<p class="no-similar">No similar servers found.</p>';
            return;
        }

        similarContainer.innerHTML = similarServers.map(server => `
            <div class="similar-server-item">
                <img class="similar-server-icon" src="${server.icon || this.getDefaultServerIcon(server.name)}" alt="${server.name}">
                <div class="similar-server-info">
                    <h5><a href="server-details.html?id=${server.id}">${server.name}</a></h5>
                    <div class="similar-server-meta">
                        <span class="similar-rating">${this.generateStarRating(server.rating || 0)}</span>
                        <span class="similar-members">${this.formatMemberCount(server.members)} members</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    generateSimilarServers() {
        // Get real servers from localStorage that match the same category
        const allServers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
        
        // Filter servers by same category and exclude current server
        const similarServers = allServers.filter(server => 
            server.id !== this.serverId && 
            server.category === this.serverData.category
        );
        
        // Limit to 3 similar servers and return
        return similarServers.slice(0, 3);
    }

    setupEventListeners() {
        // Review modal
        document.getElementById('write-review-btn').addEventListener('click', () => {
            if (this.currentUser) {
                this.openReviewModal();
            } else {
                alert('Please sign in to write a review.');
            }
        });

        // Share modal
        document.getElementById('share-server-btn').addEventListener('click', () => {
            this.openShareModal();
        });

        // Review form
        document.getElementById('submit-review-btn').addEventListener('click', () => {
            this.submitReview();
        });

        // Star rating in review modal
        this.setupStarRating();

        // Review text counter
        document.getElementById('review-text').addEventListener('input', (e) => {
            const charCount = e.target.value.length;
            document.getElementById('review-char-count').textContent = charCount;
        });

        // Review sort
        document.getElementById('review-sort').addEventListener('change', () => {
            this.displayReviews();
        });

        // Modal close handlers
        window.onclick = (event) => {
            const reviewModal = document.getElementById('review-modal');
            const shareModal = document.getElementById('share-modal');
            
            if (event.target === reviewModal) {
                this.closeReviewModal();
            }
            if (event.target === shareModal) {
                this.closeShareModal();
            }
        };
    }

    setupStarRating() {
        const stars = document.querySelectorAll('#review-star-rating .fas');
        const ratingInput = document.getElementById('review-rating');
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const rating = index + 1;
                ratingInput.value = rating;
                
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i < rating);
                });
            });
            
            star.addEventListener('mouseover', () => {
                stars.forEach((s, i) => {
                    s.classList.toggle('hover', i <= index);
                });
            });
        });
        
        document.getElementById('review-star-rating').addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hover'));
        });
    }

    // Utility methods
    getDefaultServerIcon(serverName) {
        // Generate a default icon based on server name
        const hash = this.hashCode(serverName);
        const hue = Math.abs(hash) % 360;
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
                <rect width="64" height="64" fill="hsl(${hue}, 60%, 50%)"/>
                <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
                    ${serverName.charAt(0).toUpperCase()}
                </text>
            </svg>
        `)}`;
    }

    getDefaultAvatar(username) {
        const hash = this.hashCode(username);
        const hue = Math.abs(hash) % 360;
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="20" fill="hsl(${hue}, 60%, 50%)"/>
                <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
                    ${username.charAt(0).toUpperCase()}
                </text>
            </svg>
        `)}`;
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    formatReviewDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    viewReviewerProfile(userIdOrUsername, event) {
        event.preventDefault();
        
        console.log('📱 Viewing profile for:', userIdOrUsername);
        
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

    formatMemberCount(count) {
        if (!count) return '0';
        if (count < 1000) return count.toString();
        if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
        return (count / 1000000).toFixed(1) + 'M';
    }

    displayRating(rating, reviewCount) {
        const starsContainer = document.getElementById('server-stars');
        const ratingText = document.getElementById('server-rating-text');
        
        starsContainer.innerHTML = this.generateStarRating(rating);
        ratingText.textContent = `${rating.toFixed(1)} (${reviewCount} reviews)`;
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        console.log('🌟 Generating star rating:', { rating, fullStars, hasHalfStar, emptyStars });
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star filled"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt filled"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        console.log('🌟 Generated stars HTML:', stars);
        
        return stars;
    }

    // Modal methods
    openReviewModal() {
        document.getElementById('review-modal').style.display = 'block';
    }

    closeReviewModal() {
        document.getElementById('review-modal').style.display = 'none';
        this.resetReviewForm();
    }

    openShareModal() {
        document.getElementById('share-modal').style.display = 'block';
    }

    closeShareModal() {
        document.getElementById('share-modal').style.display = 'none';
    }

    resetReviewForm() {
        document.getElementById('review-form').reset();
        document.getElementById('review-rating').value = '';
        document.getElementById('review-char-count').textContent = '0';
        document.querySelectorAll('#review-star-rating .fas').forEach(star => {
            star.classList.remove('active');
        });
    }

    submitReview() {
        const rating = document.getElementById('review-rating').value;
        const text = document.getElementById('review-text').value.trim();
        
        if (!rating || !text) {
            alert('Please provide both a rating and review text.');
            return;
        }
        
        if (text.length < 10) {
            alert('Review must be at least 10 characters long.');
            return;
        }
        
        // Get correct username from available properties
        const username = this.currentUser.display_name || 
                        this.currentUser.name || 
                        this.currentUser.username || 
                        this.currentUser.displayName || 
                        'Anonymous User';
        
        // Get avatar with priority system (same as used in dashboard and nav)
        let avatar = null;
        if (this.currentUser.custom_avatar) {
            avatar = this.currentUser.custom_avatar;
        } else if (this.currentUser.avatar && this.currentUser.avatar.includes('cdn.discordapp.com')) {
            avatar = this.currentUser.avatar;
        } else if (this.currentUser.avatar && this.currentUser.avatar.includes('ui-avatars.com')) {
            avatar = this.currentUser.avatar;
        } else {
            // Generate fallback avatar URL
            avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=5865f2&color=fff&size=64&font-size=0.33&length=2&bold=true`;
        }
        
        console.log('📝 Submitting review with username:', username, 'and avatar:', avatar, 'from user data:', this.currentUser);
        
        const newReview = {
            id: `review-${Date.now()}`,
            serverId: this.serverId,
            userId: this.currentUser.id,
            username: username,
            avatar: avatar,
            rating: parseInt(rating),
            text: text,
            date: new Date().toISOString(),
            helpful: 0,
            reported: false
        };
        
        // Add to reviews array
        this.reviews.unshift(newReview);
        
        // Save to localStorage
        localStorage.setItem(`reviews_${this.serverId}`, JSON.stringify(this.reviews));
        
        // Update server data
        this.updateServerRating();
        
        // Refresh displays
        this.displayServerStats();
        this.displayReviews();
        this.displayRating(this.serverData.rating, this.serverData.reviewCount);
        
        // Close modal
        this.closeReviewModal();
        
        // Show success message
        this.showSuccessMessage('Review submitted successfully!');
    }

    updateServerRating() {
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = this.reviews.length > 0 ? totalRating / this.reviews.length : 0;
        
        this.serverData.rating = avgRating;
        this.serverData.reviewCount = this.reviews.length;
        
        console.log(`📊 Updating server rating to ${avgRating.toFixed(1)} from ${this.reviews.length} reviews`);
        
        // Update in userServers localStorage
        let userServers = JSON.parse(localStorage.getItem('userServers') || '[]');
        let serverIndex = userServers.findIndex(s => s.id === this.serverId);
        
        if (serverIndex !== -1) {
            userServers[serverIndex].rating = avgRating;
            userServers[serverIndex].reviewCount = this.reviews.length;
            localStorage.setItem('userServers', JSON.stringify(userServers));
            console.log('✅ Updated server rating in userServers');
        }
        
        // Also update in gc_servers localStorage (alternative storage)
        let gcServers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
        serverIndex = gcServers.findIndex(s => s.id === this.serverId);
        
        if (serverIndex !== -1) {
            gcServers[serverIndex].rating = avgRating;
            gcServers[serverIndex].reviewCount = this.reviews.length;
            localStorage.setItem('gc_servers', JSON.stringify(gcServers));
            console.log('✅ Updated server rating in gc_servers');
        }
    }

    updateAuthState() {
        const loggedInNav = document.getElementById('nav-auth-logged-in');
        const loggedOutNav = document.getElementById('nav-auth-logged-out');
        
        if (this.currentUser) {
            console.log('✅ Updating nav for logged in user:', this.currentUser.name || this.currentUser.display_name);
            loggedInNav.style.display = 'flex';
            loggedOutNav.style.display = 'none';
            
            // Use correct property names for username and avatar
            const username = this.currentUser.name || this.currentUser.display_name || this.currentUser.username || 'User';
            
            const userNameElement = document.getElementById('user-name');
            const userAvatarElement = document.getElementById('user-avatar');
            
            if (userNameElement) userNameElement.textContent = username;
            
            // Set avatar with priority system (same as dashboard)
            if (userAvatarElement) {
                this.setUserAvatar(userAvatarElement, username);
            }
            
            // Setup dropdown events if not already done
            this.setupNavDropdown();
        } else {
            console.log('❌ Updating nav for logged out user');
            loggedInNav.style.display = 'none';
            loggedOutNav.style.display = 'flex';
        }
    }

    setupNavDropdown() {
        // Setup dropdown functionality if it doesn't exist
        const userMenu = document.querySelector('.user-menu');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        if (userMenu && dropdownMenu && !userMenu.hasAttribute('data-dropdown-setup')) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
            });
            
            // Setup logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
            
            // Setup server setup button
            const setupServerBtn = document.getElementById('setup-server-btn');
            if (setupServerBtn) {
                setupServerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = 'dashboard.html';
                });
            }
            
            userMenu.setAttribute('data-dropdown-setup', 'true');
        }
    }

    setUserAvatar(avatarElement, username) {
        let avatarSrc = null;
        let avatarSource = 'fallback';
        
        console.log('🖼️ Setting avatar for user:', {
            custom_avatar: this.currentUser.custom_avatar ? 'Present' : 'None',
            avatar_source: this.currentUser.avatar_source,
            discord_data: this.currentUser.discord_data ? 'Present' : 'None',
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
            avatarElement.src = avatarSrc;
            avatarElement.onerror = () => {
                console.log('❌ Avatar failed to load, using generated fallback');
                // Fallback to generated avatar
                avatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=5865f2&color=fff&size=128&font-size=0.33&length=2&bold=true`;
            };
        } else {
            console.log('🖼️ No avatar available, using generated avatar');
            // Use generated avatar as fallback
            avatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=5865f2&color=fff&size=128&font-size=0.33&length=2&bold=true`;
        }
    }

    setupLoginButton() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Redirect to home page where auth is handled
                window.location.href = 'index.html';
            });
        }
    }

    logout() {
        // Clear localStorage data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authState');
        
        // Clear auth manager if available
        if (window.authManager) {
            window.authManager.logout();
        }
        
        // Redirect to home page
        window.location.href = 'index.html';
    }

    showError(message) {
        document.getElementById('server-loading').style.display = 'none';
        const errorContainer = document.getElementById('server-not-found');
        
        // Update error content with more helpful information
        const errorContent = errorContainer.querySelector('.error-content');
        if (errorContent) {
            errorContent.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Server Not Found</h2>
                <p>The server you're looking for doesn't exist or may have been removed.</p>
                <p><small>Server ID: <code>${this.serverId}</code></small></p>
                <div class="debug-info" style="margin: 1rem 0; padding: 1rem; background: #f8fafc; border-radius: 8px; text-align: start; font-size: 0.875rem;">
                    <strong>No servers available yet.</strong><br>
                    <small>Create your own server from the dashboard to get started!</small>
                </div>
                <a href="index.html" class="btn btn-primary">
                    <i class="fas fa-home"></i> Back to Home
                </a>
                <a href="dashboard.html" class="btn btn-secondary" style="margin-inline-start: 0.5rem;">
                    <i class="fas fa-plus"></i> Create Server
                </a>
            `;
        }
        
        errorContainer.style.display = 'block';
        console.error('ServerDetailsManager Error:', message);
    }

    showSuccessMessage(message) {
        // Create and show a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            inset-block-start: 20px;
            inset-inline-end: 20px;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Global functions for modal interactions
function closeReviewModal() {
    if (window.serverDetailsManager) {
        window.serverDetailsManager.closeReviewModal();
    }
}

function closeShareModal() {
    if (window.serverDetailsManager) {
        window.serverDetailsManager.closeShareModal();
    }
}

function openReviewModal() {
    if (window.serverDetailsManager) {
        window.serverDetailsManager.openReviewModal();
    }
}

function copyShareUrl() {
    const shareUrl = document.getElementById('share-url');
    shareUrl.select();
    shareUrl.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        alert('URL copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy URL:', err);
        alert('Failed to copy URL. Please copy manually.');
    }
}

function shareOnTwitter() {
    const url = document.getElementById('share-url').value;
    const text = `Check out this Discord server: ${window.serverDetailsManager?.serverData?.name || 'Great Server'}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
}

function shareOnFacebook() {
    const url = document.getElementById('share-url').value;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
}

function shareOnDiscord() {
    const url = document.getElementById('share-url').value;
    const text = `Check out this Discord server: ${window.serverDetailsManager?.serverData?.name || 'Great Server'} ${url}`;
    
    // Copy to clipboard for pasting in Discord
    navigator.clipboard.writeText(text).then(() => {
        alert('Server link copied to clipboard! You can now paste it in Discord.');
    }).catch(() => {
        prompt('Copy this text to share in Discord:', text);
    });
}

function shareOnReddit() {
    const url = document.getElementById('share-url').value;
    const title = `Check out this Discord server: ${window.serverDetailsManager?.serverData?.name || 'Great Server'}`;
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(redditUrl, '_blank');
}

function toggleReviewHelpful(reviewId) {
    if (!window.serverDetailsManager || !window.serverDetailsManager.currentUser) {
        alert('Please sign in to mark reviews as helpful.');
        return;
    }
    
    // This would normally track which reviews the user has marked as helpful
    console.log('Toggling helpful status for review:', reviewId);
}

function reportReview(reviewId) {
    if (confirm('Are you sure you want to report this review?')) {
        console.log('Reporting review:', reviewId);
        alert('Review reported. Thank you for helping keep our community safe.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.serverDetailsManager = new ServerDetailsManager();
});

// Export for module usage
export { ServerDetailsManager };