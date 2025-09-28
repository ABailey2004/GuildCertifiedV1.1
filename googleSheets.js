// Google Sheets API integration
class GoogleSheetsAPI {
    constructor() {
        this.apiKey = CONFIG.GOOGLE_SHEETS.API_KEY;
        this.sheetId = CONFIG.GOOGLE_SHEETS.SHEET_ID;
        this.baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}`;
        this.cache = new Map();
    }

    // Generic method to get data from a sheet
    async getSheetData(sheetName, range = '') {
        const cacheKey = `${sheetName}_${range}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.APP.CACHE_DURATION) {
                return cached.data;
            }
        }

        try {
            const fullRange = range ? `${sheetName}!${range}` : sheetName;
            const url = `${this.baseUrl}/values/${fullRange}?key=${this.apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const values = data.values || [];
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: values,
                timestamp: Date.now()
            });
            
            return values;
        } catch (error) {
            console.error('Error fetching sheet data:', error);
            throw error;
        }
    }

    // Get all servers
    async getServers() {
        try {
            const data = await this.getSheetData(CONFIG.GOOGLE_SHEETS.SHEETS.SERVERS);
            if (data.length === 0) return [];
            
            const headers = data[0];
            const servers = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const server = {};
                
                headers.forEach((header, index) => {
                    server[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
                });
                
                // Parse tags if they exist
                if (server.tags) {
                    server.tags = server.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                }
                
                // Convert rating to number
                if (server.average_rating) {
                    server.average_rating = parseFloat(server.average_rating) || 0;
                }
                
                // Convert review count to number
                if (server.review_count) {
                    server.review_count = parseInt(server.review_count) || 0;
                }
                
                servers.push(server);
            }
            
            return servers;
        } catch (error) {
            console.error('Error getting servers:', error);
            return [];
        }
    }

    // Get reviews for a specific server
    async getServerReviews(serverId) {
        try {
            const data = await this.getSheetData(CONFIG.GOOGLE_SHEETS.SHEETS.REVIEWS);
            if (data.length === 0) return [];
            
            const headers = data[0];
            const reviews = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const review = {};
                
                headers.forEach((header, index) => {
                    review[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
                });
                
                // Filter by server ID and convert rating to number
                if (review.server_id === serverId) {
                    review.rating = parseInt(review.rating) || 0;
                    review.date = review.date || new Date().toISOString().split('T')[0];
                    reviews.push(review);
                }
            }
            
            // Sort by date (newest first)
            reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            return reviews;
        } catch (error) {
            console.error('Error getting reviews:', error);
            return [];
        }
    }

    // Add a new server (Note: This requires Google Apps Script for write operations)
    async addServer(serverData) {
        // REPLACE WITH YOUR ACTUAL GOOGLE APPS SCRIPT WEB APP URL:
        const webhookUrl = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addServer',
                    data: serverData
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add server');
            }
            
            // Clear cache to force refresh
            this.clearCache();
            
            return await response.json();
        } catch (error) {
            console.error('Error adding server:', error);
            throw error;
        }
    }

    // Add a new review (Note: This requires Google Apps Script for write operations)
    async addReview(reviewData) {
        // REPLACE WITH YOUR ACTUAL GOOGLE APPS SCRIPT WEB APP URL:
        const webhookUrl = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addReview',
                    data: reviewData
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add review');
            }
            
            // Clear cache to force refresh
            this.clearCache();
            
            return await response.json();
        } catch (error) {
            console.error('Error adding review:', error);
            throw error;
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Add a new user (for authentication)
    async addUser(userData) {
        // REPLACE WITH YOUR ACTUAL GOOGLE APPS SCRIPT WEB APP URL:
        const webhookUrl = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addUser',
                    data: userData
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add user');
            }
            
            // Clear cache to force refresh
            this.clearCache();
            
            return await response.json();
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

    // Get user profile
    async getUserProfile(userId) {
        try {
            const data = await this.getSheetData(CONFIG.GOOGLE_SHEETS.SHEETS.USERS);
            if (data.length === 0) return null;
            
            const headers = data[0];
            
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const user = {};
                
                headers.forEach((header, index) => {
                    user[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
                });
                
                if (user.id === userId) {
                    // Parse social links if they exist
                    if (user.social_links) {
                        try {
                            user.social_links = JSON.parse(user.social_links);
                        } catch (e) {
                            user.social_links = {};
                        }
                    }
                    
                    return user;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    // Update user profile
    async updateUserProfile(userData) {
        // REPLACE WITH YOUR ACTUAL GOOGLE APPS SCRIPT WEB APP URL:
        const webhookUrl = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateUser',
                    data: userData
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update user');
            }
            
            // Clear cache to force refresh
            this.clearCache();
            
            return await response.json();
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Get statistics
    async getStats() {
        try {
            const servers = await this.getServers();
            const totalServers = servers.length;
            const totalReviews = servers.reduce((sum, server) => sum + (server.review_count || 0), 0);
            const avgRating = servers.length > 0 
                ? servers.reduce((sum, server) => sum + (server.average_rating || 0), 0) / servers.length 
                : 0;

            return {
                totalServers,
                totalReviews,
                avgRating: Math.round(avgRating * 10) / 10
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                totalServers: 0,
                totalReviews: 0,
                avgRating: 0
            };
        }
    }
}

// Initialize the Google Sheets API
const sheetsAPI = new GoogleSheetsAPI();