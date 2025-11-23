# 🛡️ PhishGuard - Phishing Awareness Simulation Tool

A comprehensive phishing awareness simulation tool built with Node.js, Express, and EJS featuring a stunning purple and black glassmorphism theme.

## ✨ Features

- **Admin Dashboard** with real-time statistics and charts
- **User Management** with group organization
- **Email Template Builder** with rich text editor
- **Campaign Management** with scheduling capabilities
- **Tracking System** for click monitoring
- **Glassmorphism UI** with purple/black theme
- **Responsive Design** for all devices

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Application**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open http://localhost:3000
   - Login with: `admin` / `password`

## 🎨 Theme Features

- **Purple & Black Color Scheme** with glassmorphism effects
- **Blurred Glass Navigation** with backdrop filters
- **Animated Cards** with hover effects
- **Responsive Grid Layouts**
- **Modern Typography** and spacing

## 📁 Project Structure

```
├── views/
│   ├── partials/
│   │   ├── header.ejs      # Navigation with glassmorphism
│   │   ├── footer.ejs      # Scripts and closing tags
│   │   └── sidebar.ejs     # Admin sidebar navigation
│   ├── login.ejs           # Login page
│   ├── dashboard.ejs       # Main admin dashboard
│   ├── users.ejs           # User management
│   ├── user_form.ejs       # Add/edit users
│   ├── templates.ejs       # Email templates
│   ├── template_form.ejs   # Template editor
│   ├── campaigns.ejs       # Campaign management
│   ├── campaign_form.ejs   # Campaign creation
│   └── phished.ejs         # User landing page
├── public/
│   ├── css/
│   │   └── style.css       # Glassmorphism theme
│   └── js/
│       └── main.js         # Frontend interactions
├── app.js                  # Main Express application
└── package.json           # Dependencies
```

## 🔧 Next Steps for Production

1. **Database Integration**
   - Replace mock data with PostgreSQL/Sequelize
   - Set up proper data models and relationships

2. **Authentication**
   - Implement Passport.js with bcrypt
   - Add user roles and permissions

3. **Email Service**
   - Integrate SendGrid/Mailgun for email delivery
   - Add email queue with Bull/Redis

4. **Security**
   - Add CSRF protection
   - Implement rate limiting
   - Add input validation and sanitization

5. **Monitoring**
   - Add logging with Winston
   - Implement error tracking
   - Add performance monitoring

## 🎯 Key Components

- **Glassmorphism Navigation**: Blurred glass effect with purple accents
- **Dashboard Cards**: Animated statistics with hover effects
- **Rich Text Editor**: Simple WYSIWYG for email templates
- **Responsive Tables**: Mobile-friendly data display
- **Chart Integration**: Chart.js for analytics visualization

## 📧 Default Login

- **Username**: `admin`
- **Password**: `password`

## 🌟 UI Highlights

- Backdrop blur effects throughout the interface
- Purple gradient backgrounds with glass overlays
- Smooth animations and transitions
- Mobile-responsive design
- Dark theme optimized for security professionals

Ready to enhance your organization's security awareness! 🛡️
