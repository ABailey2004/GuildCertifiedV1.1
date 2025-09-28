// Main application logic for the homepage
class MainApp {
    constructor() {
        this.servers = [];
        this.filteredServers = [];
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadServers();
        this.bindEvents();
        this.updateStats();
        this.checkAuthState();
    }

    bindEvents() {
        // Search functionality
        document.getElementById('server-search')?.addEventListener('input', (e) => {
            this.searchServers(e.target.value);
        });

        // Category filter
        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Rating filter
        document.getElementById('rating-filter')?.addEventListener('change', (e) => {
            this.filterByRating(e.target.value);
        });

        // Sort functionality
        document.getElementById('sort-filter')?.addEventListener('change', (e) => {
            this.sortServers(e.target.value);
        });

        // Add server form
        document.getElementById('add-server-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddServer();
        });

        // Sign in button
        document.getElementById('sign-in-btn')?.addEventListener('click', () => {
            this.handleSignIn();
        });
    }

    async loadServers() {
        try {
            // Load from localStorage first
            const localServers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
            
            // Merge with any API servers (if you implement API later)
            this.servers = [...localServers];
            this.filteredServers = [...this.servers];
            
            // Apply server creation limit and description truncation
            this.processServerCards();
            
            this.displayServers();
            this.updateStats();
        } catch (error) {
            console.error('Error loading servers:', error);
            this.showError('Failed to load servers');
        }
    }

    processServerCards() {
        this.servers = this.servers.map(server => {
            // Truncate description to 200 characters
            if (server.description && server.description.length > 200) {
                server.displayDescription = server.description.substring(0, 200) + '....';
            } else {
                server.displayDescription = server.description || '';
            }
            
            // Ensure server has logo preview capability
            if (server.logoUrl && !server.logoPreview) {
                server.logoPreview = server.logoUrl;
            }
            
            return server;
        });
    }

    searchServers(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredServers = [...this.servers];
        } else {
            this.filteredServers = this.servers.filter(server =>
                server.name.toLowerCase().includes(searchTerm) ||
                server.description?.toLowerCase().includes(searchTerm) ||
                server.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        this.displayServers();
    }

    filterByCategory(category) {
        if (!category || category === 'all') {
            this.filteredServers = [...this.servers];
        } else {
            this.filteredServers = this.servers.filter(server =>
                server.category === category
            );
        }
        
        this.displayServers();
    }

    filterByRating(minRating) {
        if (!minRating || minRating === 'all') {
            this.filteredServers = [...this.servers];
        } else {
            const minRatingNum = parseFloat(minRating);
            this.filteredServers = this.servers.filter(server =>
                (server.averageRating || 0) >= minRatingNum
            );
        }
        
        this.displayServers();
    }

    sortServers(sortBy) {
        switch (sortBy) {
            case 'rating':
                this.filteredServers.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                break;
            case 'name':
                this.filteredServers.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'reviews':
                this.filteredServers.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                break;
            case 'newest':
                this.filteredServers.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
                break;
            default:
                // Keep original order
                break;
        }
        
        this.displayServers();
    }

    displayServers() {
        const container = document.getElementById('servers-container');
        if (!container) return;

        if (this.filteredServers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No servers found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredServers.map(server => this.createServerCard(server)).join('');
    }

    createServerCard(server) {
        const rating = server.averageRating || 0;
        const reviewCount = server.reviewCount || 0;
        const stars = this.generateStars(rating);
        
        // Show logo preview in top right if available
        const logoPreview = server.logoUrl ? 
            `<div class="server-logo-preview">
                <img src="${server.logoUrl}" alt="${server.name} logo" onerror="this.style.display='none'">
            </div>` : '';

        return `
            <div class="server-card" onclick="window.location.href='server-details.html?id=${server.id}'">
                <div class="server-card-header">
                    <h3 class="server-name">${server.name}</h3>
                    ${logoPreview}
                </div>
                <p class="server-description">${server.displayDescription}</p>
                <div class="server-meta">
                    <span class="server-category">${server.category || 'General'}</span>
                    <div class="server-rating">
                        <div class="stars">${stars}</div>
                        <span class="rating-text">${rating.toFixed(1)} (${reviewCount} reviews)</span>
                    </div>
                </div>
                <div class="server-tags">
                    ${(server.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    handleAddServer() {
        // Check if user is logged in
        if (!this.currentUser) {
            this.showError('Please sign in to add a server');
            return;
        }

        // Check server limit (3 servers max)
        const userServers = this.servers.filter(server => server.ownerId === this.currentUser.id);
        if (userServers.length >= 3) {
            this.showServerLimitPopup();
            return;
        }

        const formData = new FormData(document.getElementById('add-server-form'));
        
        const server = {
            id: Date.now().toString(),
            name: formData.get('name'),
            description: formData.get('description'),
            category: formData.get('category'),
            inviteLink: formData.get('inviteLink'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            ownerId: this.currentUser.id,
            dateAdded: new Date().toISOString(),
            averageRating: 0,
            reviewCount: 0
        };

        this.servers.push(server);
        this.saveServers();
        this.loadServers();
        
        // Reset form
        document.getElementById('add-server-form').reset();
        
        this.showSuccess('Server added successfully!');
    }

    showServerLimitPopup() {
        const popup = document.createElement('div');
        popup.className = 'server-limit-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Server Limit Reached</h3>
                <p>You can only create up to 3 servers. To add a new server, please remove one of your existing servers first.</p>
                <button onclick="this.closest('.server-limit-popup').remove()" class="btn btn-primary">
                    Got it
                </button>
            </div>
            <div class="popup-backdrop" onclick="this.closest('.server-limit-popup').remove()"></div>
        `;
        
        document.body.appendChild(popup);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(popup)) {
                popup.remove();
            }
        }, 5000);
    }

    handleSignIn() {
        if (window.authManager) {
            window.authManager.startAuth();
        } else {
            this.showError('Authentication system not available');
        }
    }

    checkAuthState() {
        // Check if user is logged in
        const userData = JSON.parse(localStorage.getItem('discord_user') || 'null');
        const sessionData = JSON.parse(sessionStorage.getItem('discord_session') || 'null');
        
        if (userData && sessionData) {
            this.currentUser = userData;
            this.updateAuthUI(true);
        } else {
            this.updateAuthUI(false);
        }
    }

    updateAuthUI(isLoggedIn) {
        const signInBtn = document.getElementById('sign-in-btn');
        if (!signInBtn) return;

        if (isLoggedIn && this.currentUser) {
            signInBtn.textContent = `👋 ${this.currentUser.username}`;
            signInBtn.onclick = () => window.location.href = 'dashboard.html';
        } else {
            signInBtn.textContent = '🔒 Sign In';
            signInBtn.onclick = () => this.handleSignIn();
        }
    }

    saveServers() {
        localStorage.setItem('gc_servers', JSON.stringify(this.servers));
    }

    updateStats() {
        const totalServers = this.servers.length;
        const totalReviews = this.servers.reduce((sum, server) => sum + (server.reviewCount || 0), 0);
        const avgRating = totalReviews > 0 ? 
            this.servers.reduce((sum, server) => sum + (server.averageRating || 0), 0) / this.servers.length : 0;

        document.getElementById('servers-count').textContent = totalServers;
        document.getElementById('reviews-count').textContent = totalReviews;
        document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
    }

    showError(message) {
        const toast = this.createToast(message, 'error');
        document.body.appendChild(toast);
    }

    showSuccess(message) {
        const toast = this.createToast(message, 'success');
        document.body.appendChild(toast);
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;
        
        setTimeout(() => toast.remove(), 3000);
        return toast;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MainApp();
});
