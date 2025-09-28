// Temporary data manager using localStorage until OAuth is set up
class LocalDataManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize empty arrays if they don't exist
        const stores = ['gc_users', 'gc_servers', 'gc_reviews', 'gc_profiles'];
        stores.forEach(store => {
            if (!localStorage.getItem(store)) {
                localStorage.setItem(store, JSON.stringify([]));
            }
        });
    }

    // Generate unique ID
    generateId() {
        return 'gc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // User management
    addUser(userData) {
        const users = JSON.parse(localStorage.getItem('gc_users') || '[]');
        const newUser = {
            id: this.generateId(),
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar || '',
            provider: userData.provider,
            created: new Date().toISOString(),
            profileType: userData.profileType || 'server',
            status: 'active'
        };
        users.push(newUser);
        localStorage.setItem('gc_users', JSON.stringify(users));
        return newUser;
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('gc_users') || '[]');
    }

    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email === email);
    }

    getUserByDiscordId(discordId) {
        const users = this.getUsers();
        return users.find(user => user.discord_id === discordId || user.id === discordId);
    }

    // Server management
    addServer(serverData) {
        const servers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
        const newServer = {
            id: this.generateId(),
            name: serverData.name,
            description: serverData.description,
            category: serverData.category,
            ownerId: serverData.ownerId,
            created: new Date().toISOString(),
            logo: serverData.logo || '',
            rating: 0,
            reviewCount: 0
        };
        servers.push(newServer);
        localStorage.setItem('gc_servers', JSON.stringify(servers));
        return newServer;
    }

    getServers() {
        return JSON.parse(localStorage.getItem('gc_servers') || '[]');
    }

    // Review management
    addReview(reviewData) {
        const reviews = JSON.parse(localStorage.getItem('gc_reviews') || '[]');
        const newReview = {
            id: this.generateId(),
            serverId: reviewData.serverId,
            userId: reviewData.userId,
            rating: reviewData.rating,
            comment: reviewData.comment,
            created: new Date().toISOString(),
            status: 'approved'
        };
        reviews.push(newReview);
        localStorage.setItem('gc_reviews', JSON.stringify(reviews));
        
        // Update server rating
        this.updateServerRating(reviewData.serverId);
        return newReview;
    }

    getReviews(serverId = null) {
        const reviews = JSON.parse(localStorage.getItem('gc_reviews') || '[]');
        return serverId ? reviews.filter(review => review.serverId === serverId) : reviews;
    }

    updateServerRating(serverId) {
        const servers = JSON.parse(localStorage.getItem('gc_servers') || '[]');
        const reviews = this.getReviews(serverId);
        
        const serverIndex = servers.findIndex(server => server.id === serverId);
        if (serverIndex >= 0 && reviews.length > 0) {
            const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            servers[serverIndex].rating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
            servers[serverIndex].reviewCount = reviews.length;
            localStorage.setItem('gc_servers', JSON.stringify(servers));
        }
    }

    // Export data (for eventual migration to Google Sheets)
    exportAllData() {
        return {
            users: this.getUsers(),
            servers: this.getServers(),
            reviews: this.getReviews(),
            profiles: JSON.parse(localStorage.getItem('gc_profiles') || '[]')
        };
    }

    // Clear all data
    clearAllData() {
        ['gc_users', 'gc_servers', 'gc_reviews', 'gc_profiles'].forEach(key => {
            localStorage.removeItem(key);
        });
        this.initializeStorage();
    }

    // Get statistics
    getStats() {
        return {
            totalUsers: this.getUsers().length,
            totalServers: this.getServers().length,
            totalReviews: this.getReviews().length,
            avgRating: this.calculateOverallRating()
        };
    }

    calculateOverallRating() {
        const reviews = this.getReviews();
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        return Math.round((sum / reviews.length) * 10) / 10;
    }

    // User session management methods (for auth compatibility)
    saveUser(userData) {
        // Save to current user session
        localStorage.setItem('gc_current_user', JSON.stringify(userData));
        
        // Also save/update in users array
        const users = JSON.parse(localStorage.getItem('gc_users') || '[]');
        const existingIndex = users.findIndex(user => 
            user.discord_id === userData.discord_id || 
            user.id === userData.id
        );
        
        if (existingIndex !== -1) {
            // Update existing user
            users[existingIndex] = { ...users[existingIndex], ...userData };
            console.log('Updated existing user in database');
        } else {
            // Add new user
            users.push(userData);
            console.log('Added new user to database');
        }
        
        localStorage.setItem('gc_users', JSON.stringify(users));
        return userData;
    }

    getUser() {
        const userData = localStorage.getItem('gc_current_user');
        return userData ? JSON.parse(userData) : null;
    }

    clearUser() {
        localStorage.removeItem('gc_current_user');
    }

    getCurrentUser() {
        return this.getUser();
    }
}

// Create global instance
window.localData = new LocalDataManager();