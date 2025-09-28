// Production-ready logging utility
class Logger {
    constructor() {
        this.isDevelopment = this.detectEnvironment();
        this.isProduction = !this.isDevelopment;
        
        // Initialize performance monitoring
        this.performanceMetrics = {
            pageLoadStart: performance.now(),
            errors: [],
            warnings: []
        };
    }

    detectEnvironment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname === '' ||
               hostname.includes('localhost');
    }

    // Development only logging
    dev(...args) {
        if (this.isDevelopment) {
            console.log('🔧 [DEV]', ...args);
        }
    }

    // Always log important info
    info(...args) {
        console.log('ℹ️ [INFO]', ...args);
    }

    // Always log warnings
    warn(...args) {
        console.warn('⚠️ [WARN]', ...args);
        if (this.isProduction) {
            this.performanceMetrics.warnings.push({
                message: args.join(' '),
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
        }
    }

    // Always log errors
    error(...args) {
        console.error('❌ [ERROR]', ...args);
        if (this.isProduction) {
            this.performanceMetrics.errors.push({
                message: args.join(' '),
                timestamp: new Date().toISOString(),
                url: window.location.href,
                stack: new Error().stack
            });
        }
    }

    // Success messages
    success(...args) {
        if (this.isDevelopment) {
            console.log('✅ [SUCCESS]', ...args);
        }
    }

    // Performance tracking
    performance(label, startTime) {
        const duration = performance.now() - startTime;
        if (this.isDevelopment) {
            console.log(`⏱️ [PERF] ${label}: ${duration.toFixed(2)}ms`);
        }
        
        // Track slow operations in production
        if (this.isProduction && duration > 1000) {
            this.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`);
        }
    }

    // Get performance metrics for analytics
    getMetrics() {
        return {
            ...this.performanceMetrics,
            pageLoadTime: performance.now() - this.performanceMetrics.pageLoadStart,
            environment: this.isDevelopment ? 'development' : 'production'
        };
    }

    // OAuth specific logging
    oauth(action, details) {
        if (this.isDevelopment) {
            console.log(`🔐 [OAUTH] ${action}:`, details);
        } else {
            // In production, only log OAuth errors
            if (action.includes('error') || action.includes('failed')) {
                this.error(`OAuth ${action}:`, details);
            }
        }
    }

    // API call logging
    api(method, url, status, duration) {
        if (this.isDevelopment) {
            const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
            console.log(`🌐 [API] ${method} ${url} ${statusEmoji} ${status} (${duration}ms)`);
        }
        
        // Log API errors in production
        if (this.isProduction && (status >= 400 || duration > 5000)) {
            this.warn(`API issue: ${method} ${url} returned ${status} in ${duration}ms`);
        }
    }
}

// Create global logger instance
window.logger = new Logger();

// Global error handler for production
if (window.logger.isProduction) {
    window.addEventListener('error', (event) => {
        window.logger.error('Uncaught error:', event.error?.message || event.message, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        window.logger.error('Unhandled promise rejection:', event.reason);
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}