// Local Data Manager for handling localStorage operations
class LocalDataManager {
    constructor() {
        this.storageKeys = {
            SERVERS: 'gc_servers',
            USERS: 'gc_users',
            REVIEWS: 'gc_reviews',
            USER_PROFILE: 'discord_user',
            SESSION: 'discord_session',
            AVATARS: 'gc_avatars'
        };
        
        this.init();
    }

    init() {
        // Initialize storage if not exists
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize servers array if not exists
        if (!localStorage.getItem(this.storageKeys.SERVERS)) {
            localStorage.setItem(this.storageKeys.SERVERS, JSON.stringify([]));
        }

        // Initialize users array if not exists
        if (!localStorage.getItem(this.storageKeys.USERS)) {
            localStorage.setItem(this.storageKeys.USERS, JSON.stringify([]));
        }

        // Initialize avatars storage if not exists
        if (!localStorage.getItem(this.storageKeys.AVATARS)) {
            localStorage.setItem(this.storageKeys.AVATARS, JSON.stringify({}));
        }
    }

    // Server operations
    getAllServers() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKeys.SERVERS) || '[]');
        } catch (error) {
            console.error('Error getting servers:', error);
            return [];
        }
    }

    saveServer(server) {
        try {
            const servers = this.getAllServers();
            const existingIndex = servers.findIndex(s => s.id === server.id);
            
            if (existingIndex !== -1) {
                servers[existingIndex] = server;
            } else {
                servers.push(server);
            }
            
            localStorage.setItem(this.storageKeys.SERVERS, JSON.stringify(servers));
            return true;
        } catch (error) {
            console.error('Error saving server:', error);
            return false;
        }
    }

    deleteServer(serverId) {
        try {
            const servers = this.getAllServers();
            const filteredServers = servers.filter(s => s.id !== serverId);
            localStorage.setItem(this.storageKeys.SERVERS, JSON.stringify(filteredServers));
            
            // Also delete associated reviews
            localStorage.removeItem(`reviews_${serverId}`);
            return true;
        } catch (error) {
            console.error('Error deleting server:', error);
            return false;
        }
    }

    getServerById(serverId) {
        const servers = this.getAllServers();
        return servers.find(s => s.id === serverId) || null;
    }

    getServersByOwner(ownerId) {
        const servers = this.getAllServers();
        return servers.filter(s => s.ownerId === ownerId);
    }

    // Review operations
    getServerReviews(serverId) {
        try {
            const reviews = localStorage.getItem(`reviews_${serverId}`);
            return reviews ? JSON.parse(reviews) : [];
        } catch (error) {
            console.error('Error getting reviews:', error);
            return [];
        }
    }

    saveReview(serverId, review) {
        try {
            const reviews = this.getServerReviews(serverId);
            const existingIndex = reviews.findIndex(r => r.id === review.id);
            
            if (existingIndex !== -1) {
                reviews[existingIndex] = review;
            } else {
                reviews.push(review);
            }
            
            localStorage.setItem(`reviews_${serverId}`, JSON.stringify(reviews));
            
            // Update server rating
            this.updateServerRating(serverId);
            return true;
        } catch (error) {
            console.error('Error saving review:', error);
            return false;
        }
    }

    deleteReview(serverId, reviewId) {
        try {
            const reviews = this.getServerReviews(serverId);
            const filteredReviews = reviews.filter(r => r.id !== reviewId);
            localStorage.setItem(`reviews_${serverId}`, JSON.stringify(filteredReviews));
            
            // Update server rating
            this.updateServerRating(serverId);
            return true;
        } catch (error) {
            console.error('Error deleting review:', error);
            return false;
        }
    }

    updateServerRating(serverId) {
        try {
            const reviews = this.getServerReviews(serverId);
            const server = this.getServerById(serverId);
            
            if (!server) return false;
            
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
                server.averageRating = totalRating / reviews.length;
                server.reviewCount = reviews.length;
            } else {
                server.averageRating = 0;
                server.reviewCount = 0;
            }
            
            this.saveServer(server);
            return true;
        } catch (error) {
            console.error('Error updating server rating:', error);
            return false;
        }
    }

    // User operations
    getCurrentUser() {
        try {
            const userData = localStorage.getItem(this.storageKeys.USER_PROFILE);
            const sessionData = sessionStorage.getItem(this.storageKeys.SESSION);
            
            if (!userData || !sessionData) {
                return null;
            }
            
            const user = JSON.parse(userData);
            const session = JSON.parse(sessionData);
            
            // Check if session is still valid
            if (session.expires_at && session.expires_at < Date.now()) {
                this.logout();
                return null;
            }
            
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    saveUserProfile(userData) {
        try {
            localStorage.setItem(this.storageKeys.USER_PROFILE, JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('Error saving user profile:', error);
            return false;
        }
    }

    logout() {
        try {
            localStorage.removeItem(this.storageKeys.USER_PROFILE);
            sessionStorage.removeItem(this.storageKeys.SESSION);
            // Don't remove servers and reviews data
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }

    // Avatar operations
    saveAvatar(userId, avatarData) {
        try {
            const avatars = JSON.parse(localStorage.getItem(this.storageKeys.AVATARS) || '{}');
            avatars[userId] = {
                data: avatarData,
                timestamp: Date.now(),
                type: 'custom'
            };
            localStorage.setItem(this.storageKeys.AVATARS, JSON.stringify(avatars));
            return true;
        } catch (error) {
            console.error('Error saving avatar:', error);
            return false;
        }
    }

    getAvatar(userId) {
        try {
            const avatars = JSON.parse(localStorage.getItem(this.storageKeys.AVATARS) || '{}');
            return avatars[userId] || null;
        } catch (error) {
            console.error('Error getting avatar:', error);
            return null;
        }
    }

    // Statistics and analytics
    getStatistics() {
        try {
            const servers = this.getAllServers();
            const currentUser = this.getCurrentUser();
            
            if (!currentUser) {
                return {
                    totalServers: servers.length,
                    totalReviews: this.getTotalReviews(),
                    averageRating: this.getAverageRating(),
                    userServers: 0,
                    userReviews: 0
                };
            }
            
            const userServers = servers.filter(s => s.ownerId === currentUser.id);
            const userReviews = this.getUserReviews(currentUser.id);
            
            return {
                totalServers: servers.length,
                totalReviews: this.getTotalReviews(),
                averageRating: this.getAverageRating(),
                userServers: userServers.length,
                userReviews: userReviews.length
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return {
                totalServers: 0,
                totalReviews: 0,
                averageRating: 0,
                userServers: 0,
                userReviews: 0
            };
        }
    }

    getTotalReviews() {
        try {
            const servers = this.getAllServers();
            return servers.reduce((total, server) => {
                const reviews = this.getServerReviews(server.id);
                return total + reviews.length;
            }, 0);
        } catch (error) {
            console.error('Error getting total reviews:', error);
            return 0;
        }
    }

    getAverageRating() {
        try {
            const servers = this.getAllServers();
            const validServers = servers.filter(s => s.averageRating > 0);
            
            if (validServers.length === 0) return 0;
            
            const totalRating = validServers.reduce((sum, server) => sum + server.averageRating, 0);
            return totalRating / validServers.length;
        } catch (error) {
            console.error('Error getting average rating:', error);
            return 0;
        }
    }

    getUserReviews(userId) {
        try {
            const servers = this.getAllServers();
            const userReviews = [];
            
            servers.forEach(server => {
                const reviews = this.getServerReviews(server.id);
                const userServerReviews = reviews.filter(review => 
                    review.userId === userId || 
                    review.username === userId
                );
                userReviews.push(...userServerReviews);
            });
            
            return userReviews;
        } catch (error) {
            console.error('Error getting user reviews:', error);
            return [];
        }
    }

    // Utility methods
    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                if (key === this.storageKeys.SESSION) {
                    sessionStorage.removeItem(key);
                } else {
                    localStorage.removeItem(key);
                }
            });
            
            // Clear individual review storage
            const servers = this.getAllServers();
            servers.forEach(server => {
                localStorage.removeItem(`reviews_${server.id}`);
            });
            
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    exportData() {
        try {
            const data = {
                servers: this.getAllServers(),
                user: this.getCurrentUser(),
                avatars: JSON.parse(localStorage.getItem(this.storageKeys.AVATARS) || '{}'),
                reviews: {}
            };
            
            // Export all reviews
            data.servers.forEach(server => {
                data.reviews[server.id] = this.getServerReviews(server.id);
            });
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Import servers
            if (data.servers) {
                localStorage.setItem(this.storageKeys.SERVERS, JSON.stringify(data.servers));
            }
            
            // Import user
            if (data.user) {
                this.saveUserProfile(data.user);
            }
            
            // Import avatars
            if (data.avatars) {
                localStorage.setItem(this.storageKeys.AVATARS, JSON.stringify(data.avatars));
            }
            
            // Import reviews
            if (data.reviews) {
                Object.entries(data.reviews).forEach(([serverId, reviews]) => {
                    localStorage.setItem(`reviews_${serverId}`, JSON.stringify(reviews));
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Initialize global data manager
window.dataManager = new LocalDataManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalDataManager;
}
