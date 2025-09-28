// Profile Setup Wizard
class ProfileSetup {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 3;
        this.selectedProfileType = null;
        this.profileData = {};
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Profile type selection
        document.querySelectorAll('.profile-type-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectProfileType(card.dataset.type);
            });
        });

        // Navigation buttons
        document.getElementById('next-step')?.addEventListener('click', () => {
            this.nextStep();
        });

        document.getElementById('prev-step')?.addEventListener('click', () => {
            this.prevStep();
        });

        // Form submission
        document.getElementById('profile-setup-form')?.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        document.getElementById('finish-setup')?.addEventListener('click', () => {
            this.finishSetup();
        });
    }

    show(userData) {
        this.userData = userData;
        this.currentStep = 1;
        this.updateStepDisplay();
        
        // Pre-fill form with Discord data
        this.prefillDiscordData(userData);
        
        document.getElementById('profile-setup-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hide() {
        document.getElementById('profile-setup-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    prefillDiscordData(userData) {
        // Pre-fill display name with Discord name and make it read-only
        const nameInput = document.getElementById('profile-name');
        if (nameInput && userData) {
            // Use Discord username (not display name, to show actual Discord @username)
            const discordName = userData.username || userData.global_name || userData.name;
            if (discordName) {
                nameInput.value = discordName;
                // Make it read-only since it should match Discord username
                nameInput.readOnly = true;
                nameInput.style.backgroundColor = '#f8f9fa';
                nameInput.style.cursor = 'not-allowed';
                
                // Add a note to explain why it's locked
                const noteElement = nameInput.parentNode.querySelector('.discord-note');
                if (!noteElement) {
                    const note = document.createElement('small');
                    note.className = 'discord-note';
                    note.style.color = '#6c757d';
                    note.style.display = 'block';
                    note.style.marginTop = '4px';
                    note.textContent = '🔒 Display name is locked to your Discord username';
                    nameInput.parentNode.appendChild(note);
                }
            }
        }

        // Pre-fill Discord link if we have Discord data
        const discordLinkInput = document.getElementById('discord-link');
        if (discordLinkInput && userData.discord_data) {
            // Use Discord username if available
            const discordUsername = userData.discord_data.username;
            if (discordUsername) {
                discordLinkInput.value = `@${discordUsername}`;
            }
        }
    }

    selectProfileType(type) {
        this.selectedProfileType = type;
        console.log('🎯 Profile type selected:', type);
        
        // Update UI
        document.querySelectorAll('.profile-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');
        
        // Enable next button
        document.getElementById('next-step').disabled = false;
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.currentStep++;
            this.updateStepDisplay();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                if (!this.selectedProfileType) {
                    this.showError('Please select what best describes you.');
                    return false;
                }
                break;
            case 2:
                const nameInput = document.getElementById('profile-name');
                if (!nameInput.value.trim()) {
                    this.showError('Please enter a display name.');
                    nameInput.focus();
                    return false;
                }
                break;
            case 3:
                // Step 3 is optional, no validation needed
                break;
        }
        return true;
    }

    updateStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.setup-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        document.querySelector(`[data-step="${this.currentStep}"]`).classList.add('active');

        // Update navigation buttons
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const finishBtn = document.getElementById('finish-setup');

        prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        
        if (this.currentStep < this.maxSteps) {
            nextBtn.style.display = 'block';
            finishBtn.style.display = 'none';
            nextBtn.disabled = this.currentStep === 1 && !this.selectedProfileType;
        } else {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'block';
        }

        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const progressPercent = (this.currentStep / this.maxSteps) * 100;
        
        progressFill.style.width = `${progressPercent}%`;
        progressText.textContent = `Step ${this.currentStep} of ${this.maxSteps}`;
    }

    collectFormData() {
        const formData = {
            profile_type: this.selectedProfileType,
            display_name: document.getElementById('profile-name').value.trim(),
            description: document.getElementById('profile-description').value.trim(),
            website: document.getElementById('profile-website').value.trim(),
            social_links: {
                discord: document.getElementById('discord-link').value.trim(),
                instagram: document.getElementById('instagram-link').value.trim(),
                youtube: document.getElementById('youtube-link').value.trim(),
                twitter: document.getElementById('twitter-link').value.trim(),
                twitch: document.getElementById('twitch-link').value.trim(),
                github: document.getElementById('github-link').value.trim(),
            }
        };

        console.log('📋 Collecting form data:', formData);

        // Clean up empty social links
        Object.keys(formData.social_links).forEach(key => {
            if (!formData.social_links[key]) {
                delete formData.social_links[key];
            }
        });

        return formData;
    }

    async finishSetup() {
        try {
            const formData = this.collectFormData();
            
            // Update user data
            const updatedUser = {
                ...this.userData,
                ...formData,
                profile_completed: true,
                setup_completed_at: new Date().toISOString()
            };

            // Debug: Log the user data being saved
            console.log('💾 Profile setup - saving user data:', {
                original: this.userData,
                formData: formData,
                updated: updatedUser
            });

            // Save to backend/database
            await this.saveProfile(updatedUser);

            // Update auth manager and localStorage
            if (window.authManager) {
                window.authManager.currentUser = updatedUser;
                window.authManager.authState = 'logged-in';
                if (window.authManager.saveAuthState) {
                    window.authManager.saveAuthState();
                }
                if (window.authManager.updateUI) {
                    window.authManager.updateUI();
                }
            }
            
            // Also update localStorage directly to ensure persistence
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            localStorage.setItem('authState', 'logged-in');
            
            // Update localData if available
            if (window.localData && window.localData.saveUser) {
                window.localData.saveUser(updatedUser);
            }

            this.hide();
            this.showSuccess('Profile setup completed! Welcome to GuildCertified!');
            
            // Redirect to dashboard page
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            console.error('Profile setup failed:', error);
            this.showError('Failed to complete setup. Please try again.');
        }
    }

    async saveProfile(userData) {
        try {
            // In a real app, this would save to your backend
            // For demo, we'll update localStorage
            const users = JSON.parse(localStorage.getItem('gc_users') || '[]');
            const existingIndex = users.findIndex(u => u.id === userData.id);
            
            if (existingIndex >= 0) {
                users[existingIndex] = userData;
            } else {
                users.push(userData);
            }
            
            localStorage.setItem('gc_users', JSON.stringify(users));

            // Also save to Google Sheets if configured
            if (window.sheetsAPI) {
                await window.sheetsAPI.addUser(userData);
            }

        } catch (error) {
            console.error('Error saving profile:', error);
            throw error;
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        // This is handled by the finish button instead
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
        // You could implement a toast notification system here
        console.log('Success:', message);
    }

    showError(message) {
        // You could implement a toast notification system here
        console.error('Error:', message);
        alert(message);
    }
}

// Initialize profile setup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileSetup = new ProfileSetup();
});