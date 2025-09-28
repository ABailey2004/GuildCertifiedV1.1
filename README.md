# RateMyServer 🚀

A modern Discord server review platform that allows users to discover, review, and rate Discord servers. Built with vanilla JavaScript, HTML5, and CSS3 for optimal performance and compatibility.

## ✨ Features

### 🔐 Authentication
- **Discord OAuth2 Integration** - Seamless login with Discord
- **Persistent Sessions** - Stay logged in across browser sessions
- **User Profiles** - Individual and Development Studio profile types

### 🖥️ Server Management
- **Server Discovery** - Browse and search Discord servers
- **Server Creation** - Add your own servers with detailed information
- **Server Limits** - Smart 3-server limit with helpful notifications
- **Rich Profiles** - Custom descriptions, logos, categories, and social links

### ⭐ Review System
- **Star Ratings** - 1-5 star rating system
- **Written Reviews** - Detailed feedback and experiences
- **Review Analytics** - Rating breakdowns and statistics
- **User Verification** - Discord-verified reviewer system

### 👤 User Profiles
- **Public Profiles** - Shareable user profiles with statistics
- **Profile Statistics** - Reviews given, servers owned, profile views, average ratings
- **Avatar System** - Custom uploads, Discord avatars, or generated fallbacks
- **Social Sharing** - Share profiles on social media platforms

### 📱 Modern UI/UX
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Clean Interface** - Modern, intuitive design
- **Fast Performance** - Client-side architecture for instant loading
- **Accessible** - Built with accessibility best practices

## 🚀 Quick Start

### Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ratemyserver.git
   cd ratemyserver
   ```

2. **Set up Discord OAuth**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Add OAuth2 redirect URI: `http://localhost:8000`
   - Copy your Client ID to `js/config.js`

3. **Start local server**
   ```bash
   # Using live-server (recommended)
   npx live-server --port=8000
   
   # Or using Python
   python -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server -p 8000
   ```

4. **Open in browser**
   - Navigate to `http://localhost:8000`
   - Click "Login with Discord" to test authentication

### Production Deployment (Cloudflare Pages)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Cloudflare Pages**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Connect your GitHub repository
   - Build settings:
     - **Build command**: Leave empty (static site)
     - **Build output directory**: `/` (root)
     - **Root directory**: `/` (or `/RateMyServer` if nested)

3. **Update Discord OAuth**
   - Add your production domain to Discord app redirects
   - Example: `https://yoursite.pages.dev`

4. **Go Live!** 🎉
   - Your site will be live in ~1 minute
   - Automatic deployments on every git push

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Authentication**: Discord OAuth2 API
- **Storage**: Browser localStorage (client-side)
- **Hosting**: Cloudflare Pages (recommended)
- **Version Control**: Git/GitHub

## 📁 Project Structure

```
RateMyServer/
├── index.html              # Homepage with server discovery
├── dashboard.html          # User dashboard and server management
├── profile.html           # Public user profiles
├── server-details.html    # Individual server details page
├── js/                    # JavaScript modules
│   ├── main.js           # Homepage functionality
│   ├── dashboard.js      # Dashboard logic
│   ├── profileViewer.js  # Profile display logic
│   ├── serverDetails.js  # Server details page
│   ├── auth.js          # Authentication handling
│   └── config.js        # Configuration settings
├── styles/
│   └── main.css         # All styling
└── README.md           # This file
```

## 🔧 Configuration

### Discord OAuth Setup
1. Create a Discord application at https://discord.com/developers/applications
2. Navigate to OAuth2 → General
3. Add redirect URIs:
   - Development: `http://localhost:8000`
   - Production: `https://yourdomain.com`
4. Note your Client ID for configuration

### Environment Configuration
The app automatically detects development vs production:
- **Development**: Uses `localhost` or `127.0.0.1`
- **Production**: Uses `window.location.origin`

## 🎨 Customization

### Branding
- Update site title in HTML files
- Modify color scheme in `styles/main.css`
- Replace favicon and logo assets

### Features
- Server categories in `js/dashboard.js`
- Profile types in profile setup
- Review system parameters

## 🚀 Performance

- **Client-side rendering** for instant page loads
- **Local storage caching** for offline functionality
- **Optimized assets** for fast loading
- **Mobile-first responsive design**

## 🔐 Security

- **Discord OAuth2** for secure authentication
- **Client-side only** - no server-side vulnerabilities
- **Local data storage** - user data stays in browser
- **HTTPS enforced** in production

## � Analytics

Compatible with:
- Google Analytics
- Cloudflare Analytics  
- Plausible Analytics
- Any client-side analytics solution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs on GitHub Issues
- **Documentation**: Check this README and code comments
- **Discord**: Join our community server (coming soon!)

## 🗺️ Roadmap

- [ ] Advanced search and filtering
- [ ] Server categories and tags
- [ ] Email notifications for reviews
- [ ] Admin dashboard
- [ ] API for third-party integrations
- [ ] Mobile app (PWA)

---

**Built with ❤️ for the Discord community**

*Star ⭐ this repo if you find it useful!*