// Main application logic
class RateMyServerApp {
    constructor() {
        this.servers = [];
        this.filteredServers = [];
        this.currentServer = null;
        this.currentRating = 5;
        
        this.init();
    }

    async init() {
        // Clear any unwanted hash from URL on page load
        if (window.location.hash === '#profile' || window.location.hash === '#settings') {
            history.replaceState(null, null, window.location.pathname);
        }
        
        this.bindEvents();
        await this.loadData();
        this.updateStats();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.getAttribute('href'));
            });
        });

        // Search
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        searchInput.addEventListener('input', () => this.filterServers());
        searchBtn.addEventListener('click', () => this.filterServers());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.filterServers();
        });

        // Filters
        document.getElementById('category-filter').addEventListener('change', () => this.filterServers());
        document.getElementById('rating-filter').addEventListener('change', () => this.filterServers());
        document.getElementById('sort-by').addEventListener('change', () => this.filterServers());

        // Modals
        this.bindModalEvents();

        // Forms
        this.bindFormEvents();
    }

    bindModalEvents() {
        // Add server modal
        const addServerLink = document.querySelector('a[href="#add-server"]');
        const addServerModal = document.getElementById('add-server-modal');
        
        if (addServerLink) {
            addServerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal('add-server-modal');
            });
        }

        // Close modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    bindFormEvents() {
        // Add server form
        const addServerForm = document.getElementById('add-server-form');
        if (addServerForm) {
            addServerForm.addEventListener('submit', (e) => this.handleAddServer(e));
        }

        // Review form
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => this.handleAddReview(e));
        }

        // Star rating
        this.bindStarRating();
    }

    bindStarRating() {
        const stars = document.querySelectorAll('#star-rating i');
        
        // Only bind if star rating exists (not on all pages)
        if (stars.length === 0) return;
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                this.currentRating = index + 1;
                this.updateStarDisplay();
            });
            
            star.addEventListener('mouseenter', () => {
                this.highlightStars(index + 1);
            });
        });

        const starRating = document.getElementById('star-rating');
        if (starRating) {
            starRating.addEventListener('mouseleave', () => {
                this.updateStarDisplay();
            });
        }
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('#star-rating i');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    updateStarDisplay() {
        this.highlightStars(this.currentRating);
    }

    updateServerRatings() {
        console.log('📊 Updating server ratings based on stored reviews...');
        
        this.servers.forEach(server => {
            const serverId = server.id || server.name;
            const storedReviews = JSON.parse(localStorage.getItem(`reviews_${serverId}`) || '[]');
            
            if (storedReviews.length > 0) {
                const totalRating = storedReviews.reduce((sum, review) => sum + review.rating, 0);
                const avgRating = totalRating / storedReviews.length;
                
                server.average_rating = avgRating;
                server.review_count = storedReviews.length;
                server.rating = avgRating; // Also set 'rating' property for compatibility
                server.reviewCount = storedReviews.length; // Also set 'reviewCount' property for compatibility
                
                console.log(`✅ Server "${server.name}": ${avgRating.toFixed(1)} stars from ${storedReviews.length} reviews`);
            } else {
                server.average_rating = 0;
                server.review_count = 0;
                server.rating = 0;
                server.reviewCount = 0;
            }
        });
        
        console.log('✅ Server ratings updated');
    }

    async loadData() {
        try {
            this.showLoading(true);
            
            // Load servers from both sources
            let servers = [];
            
            // Load from sheets API (existing servers)
            try {
                const apiServers = await sheetsAPI.getServers();
                servers = apiServers || [];
            } catch (apiError) {
                console.warn('Could not load from sheets API:', apiError);
                servers = [];
            }
            
            // Load user-created servers from localStorage
            const localServers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
            console.log('Loaded local servers:', localServers);
            
            // Combine both sources (local servers first so they appear at the top)
            this.servers = [...localServers, ...servers];
            
            // Update server ratings based on stored reviews
            this.updateServerRatings();
            
            this.filteredServers = [...this.servers];
            this.renderServers();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load servers. Please check your internet connection and try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async updateStats() {
        try {
            const stats = await sheetsAPI.getStats();
            
            // Only update if elements exist (for main page)
            const totalServersEl = document.getElementById('total-servers');
            const totalReviewsEl = document.getElementById('total-reviews');
            const avgRatingEl = document.getElementById('avg-rating');
            
            if (totalServersEl) totalServersEl.textContent = stats.totalServers;
            if (totalReviewsEl) totalReviewsEl.textContent = stats.totalReviews;
            if (avgRatingEl) avgRatingEl.textContent = stats.avgRating.toFixed(1);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    filterServers() {
        const searchInput = document.getElementById('search-input');
        const categoryFilterEl = document.getElementById('category-filter');
        const ratingFilterEl = document.getElementById('rating-filter');
        const sortByEl = document.getElementById('sort-by');
        
        // Check if elements exist (may not be present on all pages)
        if (!searchInput || !categoryFilterEl || !ratingFilterEl || !sortByEl) {
            return;
        }
        
        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = categoryFilterEl.value;
        const ratingFilter = ratingFilterEl.value;
        const sortBy = sortByEl.value;

        let filtered = this.servers.filter(server => {
            // Search filter
            const matchesSearch = !searchTerm || 
                server.name?.toLowerCase().includes(searchTerm) ||
                server.description?.toLowerCase().includes(searchTerm) ||
                (server.tags && server.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

            // Category filter
            const matchesCategory = !categoryFilter || server.category === categoryFilter;

            // Rating filter
            const matchesRating = !ratingFilter || (server.average_rating || 0) >= parseInt(ratingFilter);

            return matchesSearch && matchesCategory && matchesRating;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return (b.average_rating || 0) - (a.average_rating || 0);
                case 'newest':
                    return new Date(b.date_added || 0) - new Date(a.date_added || 0);
                case 'oldest':
                    return new Date(a.date_added || 0) - new Date(b.date_added || 0);
                case 'reviews':
                    return (b.review_count || 0) - (a.review_count || 0);
                default:
                    return 0;
            }
        });

        this.filteredServers = filtered;
        this.renderServers();
    }

    renderServers() {
        const container = document.getElementById('servers-container');
        const noResults = document.getElementById('no-results');
        
        // Check if elements exist (may not be present on all pages)
        if (!container) return;

        if (this.filteredServers.length === 0) {
            container.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        
        container.innerHTML = this.filteredServers.map(server => `
            <div class="server-card fade-in" data-server-id="${server.id || server.name}">
                <div class="server-header">
                    <div class="server-info">
                        <h3>${this.escapeHtml(server.name || 'Unnamed Server')}</h3>
                        <div class="server-category">${this.escapeHtml(server.category || 'General')}</div>
                    </div>
                    <div class="server-logo">
                        <img src="${server.icon || server.logo || this.getDefaultServerIcon(server.name)}" 
                             alt="${this.escapeHtml(server.name)} Logo" 
                             class="server-logo-img">
                    </div>
                </div>
                
                <div class="server-description">
                    ${this.truncateDescription(server.description || 'No description available.')}
                </div>
                
                <div class="server-rating">
                    <div class="stars">
                        ${this.renderStars(server.average_rating || 0)}
                    </div>
                    <span class="rating-text">
                        ${(server.average_rating || 0).toFixed(1)} 
                        (${server.review_count || 0} review${(server.review_count || 0) !== 1 ? 's' : ''})
                    </span>
                </div>
                
                ${server.tags && server.tags.length > 0 ? `
                    <div class="server-tags">
                        ${server.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="server-actions">
                    <button class="btn btn-primary" onclick="app.openReviewModal('${server.id || server.name}')">
                        <i class="fas fa-star"></i> Write Review
                    </button>
                    <button class="btn btn-secondary" onclick="app.viewServerDetails('${server.id || server.name}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${server.invite_link ? `
                        <a href="${server.invite_link}" target="_blank" class="btn btn-outline">
                            <i class="fab fa-discord"></i> Join Server
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star filled"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt filled"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        
        return starsHtml;
    }

    async openReviewModal(serverId) {
        const server = this.servers.find(s => (s.id || s.name) === serverId);
        if (!server) return;

        this.currentServer = server;
        this.currentRating = 5;
        
        const reviewServerInfo = document.getElementById('review-server-info');
        if (reviewServerInfo) {
            reviewServerInfo.innerHTML = `
                <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-block-end: 1rem;">
                    <h4>${this.escapeHtml(server.name)}</h4>
                    <p style="margin: 0; color: #64748b;">${this.escapeHtml(server.description)}</p>
                </div>
            `;
        }
        
        this.updateStarDisplay();
        this.showModal('review-modal');
    }

    async viewServerDetails(serverId) {
        // Redirect to server details page
        window.location.href = `server-details.html?id=${encodeURIComponent(serverId)}`;
    }

    async handleAddServer(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const serverData = {
            name: formData.get('server-name') || document.getElementById('server-name').value,
            description: formData.get('server-description') || document.getElementById('server-description').value,
            category: formData.get('server-category') || document.getElementById('server-category').value,
            invite_link: formData.get('server-invite') || document.getElementById('server-invite').value,
            tags: (formData.get('server-tags') || document.getElementById('server-tags').value).split(',').map(tag => tag.trim()).filter(tag => tag),
            date_added: new Date().toISOString().split('T')[0],
            average_rating: 0,
            review_count: 0
        };

        try {
            await sheetsAPI.addServer(serverData);
            this.closeModal(document.getElementById('add-server-modal'));
            e.target.reset();
            await this.loadData();
            await this.updateStats();
            this.showSuccess('Server added successfully!');
        } catch (error) {
            console.error('Error adding server:', error);
            this.showError('Failed to add server. Please try again.');
        }
    }

    async handleAddReview(e) {
        e.preventDefault();
        
        if (!this.currentServer) return;

        const formData = new FormData(e.target);
        const reviewerName = formData.get('reviewer-name') || document.getElementById('reviewer-name').value;
        const reviewText = formData.get('review-text') || document.getElementById('review-text').value;
        
        if (!reviewerName || !reviewText) {
            this.showError('Please fill in both your name and review text.');
            return;
        }
        
        if (reviewText.length < 10) {
            this.showError('Review must be at least 10 characters long.');
            return;
        }

        const serverId = this.currentServer.id || this.currentServer.name;
        const newReview = {
            id: `review-${Date.now()}`,
            serverId: serverId,
            username: reviewerName,
            rating: this.currentRating,
            text: reviewText,
            date: new Date().toISOString(),
            helpful: 0,
            reported: false
        };

        try {
            // Save review to localStorage (same as server details page)
            const existingReviews = JSON.parse(localStorage.getItem(`reviews_${serverId}`) || '[]');
            existingReviews.unshift(newReview);
            localStorage.setItem(`reviews_${serverId}`, JSON.stringify(existingReviews));
            
            // Also try to save to sheets API if available
            try {
                const reviewData = {
                    server_id: serverId,
                    reviewer_name: reviewerName,
                    rating: this.currentRating,
                    review_text: reviewText,
                    date: new Date().toISOString().split('T')[0]
                };
                await sheetsAPI.addReview(reviewData);
            } catch (apiError) {
                console.warn('Could not save to sheets API:', apiError);
                // Continue anyway since we saved locally
            }
            
            // Close modal and reset form
            this.closeModal(document.getElementById('review-modal'));
            e.target.reset();
            this.currentRating = 5;
            
            // Refresh server ratings and display
            this.updateServerRatings();
            this.renderServers();
            
            this.showSuccess('Review added successfully!');
        } catch (error) {
            console.error('Error adding review:', error);
            this.showError('Failed to add review. Please try again.');
        }
    }

    handleNavigation(href) {
        // Skip if it's not a hash link or if it's meant for external navigation
        if (!href.startsWith('#') || href === '#profile' || href === '#settings') {
            return;
        }
        
        const target = href.replace('#', '');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const targetLink = document.querySelector(`a[href="${href}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }

        // Scroll to section
        const element = document.getElementById(target);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const container = document.getElementById('servers-container');
        
        if (show) {
            loading.style.display = 'block';
            container.style.display = 'none';
        } else {
            loading.style.display = 'none';
            container.style.display = 'grid';
        }
    }

    showSuccess(message) {
        // You could implement a toast notification system here
        alert(message);
    }

    showError(message) {
        // You could implement a toast notification system here
        alert(message);
    }

    getDefaultServerIcon(serverName) {
        // Generate a default icon based on server name
        const hash = this.hashCode(serverName || 'Server');
        const hue = Math.abs(hash) % 360;
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
                <rect width="64" height="64" fill="hsl(${hue}, 60%, 50%)" rx="12"/>
                <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">
                    ${(serverName || 'S').charAt(0).toUpperCase()}
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

    truncateDescription(description) {
        if (description.length <= 200) {
            return this.escapeHtml(description);
        }
        
        // Find the last complete word before 200 characters
        let truncated = description.substring(0, 200);
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        
        if (lastSpaceIndex > 150) { // Only break at word if it's not too short
            truncated = truncated.substring(0, lastSpaceIndex);
        }
        
        return this.escapeHtml(truncated) + '....';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RateMyServerApp();
});
