# Custom Profile Picture Upload Guide

## 📷 **New Upload System**

Users can now upload their own profile pictures from their device instead of relying on Discord avatars!

### ✅ **How to Upload a Profile Picture**

1. **Go to your Dashboard**
2. **Click the camera icon** on your profile picture
3. **Select an image file** from your device
4. **Done!** The image is automatically resized and saved

### 🎯 **Features**

- **File Types**: Supports all image formats (JPG, PNG, GIF, WebP, etc.)
- **Auto Resize**: Images are automatically resized to 300x300px for optimal performance
- **File Size Limit**: 5MB maximum file size
- **Quality**: Images are compressed to JPEG format at 80% quality for faster loading
- **Local Storage**: Images are stored locally in your browser

### 🔄 **Avatar Priority System**

The dashboard now uses this priority order:

1. **Custom Uploaded Photo** - Your uploaded image (highest priority)
2. **Discord CDN Avatar** - Your Discord profile picture (if available)
3. **Discord Default Avatar** - Discord's default based on your user ID
4. **Generated Avatar** - Fallback with your initials

### 🎨 **Managing Your Profile Picture**

**To Change Your Photo:**
- Click the camera icon and select a new image

**To Remove Your Custom Photo:**
- Right-click on your profile picture
- Select "Remove Custom Photo"
- This will revert to Discord avatar or generated avatar

**Visual Feedback:**
- Hover effects on upload button
- Success/error notifications
- Loading states during upload

### 💾 **Technical Details**

- Images are stored as Base64 data URLs in localStorage
- Automatic image compression and resizing
- Fallback system ensures there's always a profile picture
- No server storage required - everything is client-side

### 🚀 **Usage Tips**

- **Best Results**: Use square images (1:1 aspect ratio)
- **File Size**: Keep images under 5MB for best performance
- **Quality**: High-resolution images work best as they're automatically optimized
- **Browser Storage**: Images are saved locally and persist across sessions

### 🔧 **For Developers**

The system adds these new fields to the user object:
- `custom_avatar`: Base64 data URL of the uploaded image
- `avatar_source`: Tracks the source ('custom', 'discord', etc.)

Images are automatically processed through:
1. File validation (type and size)
2. Base64 conversion
3. Canvas-based resizing
4. JPEG compression
5. localStorage persistence