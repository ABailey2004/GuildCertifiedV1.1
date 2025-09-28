// Enhanced Google Sheets integration without Google Apps Script
class GoogleSheetsManager {
    constructor() {
        this.apiKey = CONFIG.GOOGLE_SHEETS.API_KEY;
        this.sheetId = CONFIG.GOOGLE_SHEETS.SHEET_ID;
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    }

    // Read data from a specific range
    async readRange(range) {
        try {
            const url = `${this.baseUrl}/${this.sheetId}/values/${range}?key=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error.message);
            }
            
            return data.values || [];
        } catch (error) {
            console.error('Error reading from sheet:', error);
            throw error;
        }
    }

    // Write data to a specific range (requires public sheet with edit permissions)
    async writeRange(range, values) {
        try {
            const url = `${this.baseUrl}/${this.sheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${this.apiKey}`;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: values
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error.message);
            }
            
            return data;
        } catch (error) {
            console.error('Error writing to sheet:', error);
            throw error;
        }
    }

    // Append data to a sheet
    async appendData(sheetName, values) {
        try {
            const url = `${this.baseUrl}/${this.sheetId}/values/${sheetName}:append?valueInputOption=USER_ENTERED&key=${this.apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: values
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error.message);
            }
            
            return data;
        } catch (error) {
            console.error('Error appending to sheet:', error);
            throw error;
        }
    }

    // Add a new user
    async addUser(userData) {
        const row = [
            this.generateId(),
            userData.email,
            userData.name,
            userData.avatar || '',
            userData.provider,
            new Date().toISOString(),
            userData.profileType || 'server',
            'active'
        ];
        
        return await this.appendData('Users', [row]);
    }

    // Add a new server
    async addServer(serverData) {
        const row = [
            this.generateId(),
            serverData.name,
            serverData.description,
            serverData.category,
            serverData.ownerId,
            new Date().toISOString(),
            serverData.logo || '',
            0, // initial rating
            0  // initial review count
        ];
        
        return await this.appendData('Servers', [row]);
    }

    // Add a new review
    async addReview(reviewData) {
        const row = [
            this.generateId(),
            reviewData.serverId,
            reviewData.userId,
            reviewData.rating,
            reviewData.comment,
            new Date().toISOString(),
            'approved'
        ];
        
        return await this.appendData('Reviews', [row]);
    }

    // Get all users
    async getUsers() {
        try {
            const data = await this.readRange('Users!A:H');
            if (data.length === 0) return [];
            
            const headers = data[0];
            return data.slice(1).map(row => {
                const user = {};
                headers.forEach((header, index) => {
                    user[header.toLowerCase().replace('_', '')] = row[index] || '';
                });
                return user;
            });
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    // Get all servers
    async getServers() {
        try {
            const data = await this.readRange('Servers!A:I');
            if (data.length === 0) return [];
            
            const headers = data[0];
            return data.slice(1).map(row => {
                const server = {};
                headers.forEach((header, index) => {
                    server[header.toLowerCase().replace('_', '')] = row[index] || '';
                });
                return server;
            });
        } catch (error) {
            console.error('Error getting servers:', error);
            return [];
        }
    }

    // Generate a simple unique ID
    generateId() {
        return 'gc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Initialize sheets with headers if they don't exist
    async initializeSheets() {
        const sheetsToCreate = [
            {
                name: 'Users',
                headers: ['ID', 'Email', 'Name', 'Avatar', 'Provider', 'Created', 'Profile_Type', 'Status']
            },
            {
                name: 'Servers', 
                headers: ['ID', 'Name', 'Description', 'Category', 'Owner_ID', 'Created', 'Logo', 'Rating', 'Review_Count']
            },
            {
                name: 'Reviews',
                headers: ['ID', 'Server_ID', 'User_ID', 'Rating', 'Comment', 'Created', 'Status']
            },
            {
                name: 'Profiles',
                headers: ['ID', 'User_ID', 'Business_Name', 'Description', 'Website', 'Discord', 'Social_Links', 'Logo']
            }
        ];

        for (const sheet of sheetsToCreate) {
            try {
                // Try to read first row to see if headers exist
                const existingData = await this.readRange(`${sheet.name}!1:1`);
                
                if (existingData.length === 0) {
                    // Sheet is empty, add headers
                    await this.writeRange(`${sheet.name}!1:1`, [sheet.headers]);
                    console.log(`✅ Headers added to ${sheet.name} sheet`);
                }
            } catch (error) {
                console.log(`❌ Could not initialize ${sheet.name} sheet:`, error.message);
            }
        }
    }
}

// Create global instance
window.googleSheets = new GoogleSheetsManager();
