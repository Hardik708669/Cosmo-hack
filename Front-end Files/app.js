const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: 'secureguard-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mock data for demonstration
const mockData = {
    stats: {
        totalUsers: 150,
        activeCampaigns: 3,
        clickRate: 23,
        totalTemplates: 8
    },
    recentCampaigns: [
        { id: 1, name: 'Q4 Security Test', status: 'Completed', sent: 50, clicked: 12, createdAt: new Date() },
        { id: 2, name: 'New Employee Training', status: 'Active', sent: 25, clicked: 5, createdAt: new Date() }
    ],
    users: [
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@company.com', group: 'Sales' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@company.com', group: 'Engineering' }
    ],
    templates: [
        { id: 1, name: 'Fake Password Reset', subject: 'Urgent: Password Reset Required', senderName: 'IT Support', senderEmail: 'it@company.com', category: 'phishing' },
        { id: 2, name: 'Suspicious Invoice', subject: 'Invoice Payment Required', senderName: 'Accounting', senderEmail: 'billing@company.com', category: 'spear-phishing' }
    ],
    campaigns: [
        { id: 1, name: 'Q4 Security Test', template: 'Fake Password Reset', targetGroup: 'Sales', status: 'Completed', sent: 50, clicked: 12 },
        { id: 2, name: 'New Employee Training', template: 'Suspicious Invoice', targetGroup: 'Engineering', status: 'Active', sent: 25, clicked: 5 }
    ]
};

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.authenticated && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Routes
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user by username
        const user = await User.findByUsername(username);
        if (!user) {
            return res.render('login', { error: 'Invalid username or password' });
        }
        
        // Validate password
        const isValidPassword = await User.validatePassword(user, password);
        if (!isValidPassword) {
            return res.render('login', { error: 'Invalid username or password' });
        }
        
        // Set session
        req.session.authenticated = true;
        req.session.user = { ...user, password: undefined };
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred during login' });
    }
});

app.get('/signup', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('signup', { error: null, success: null });
});

app.post('/signup', async (req, res) => {
    try {
        const { fullName, email, username, password, confirmPassword } = req.body;
        
        // Validation
        if (!fullName || !email || !username || !password) {
            return res.render('signup', { error: 'All fields are required', success: null });
        }
        
        if (password !== confirmPassword) {
            return res.render('signup', { error: 'Passwords do not match', success: null });
        }
        
        if (password.length < 6) {
            return res.render('signup', { error: 'Password must be at least 6 characters long', success: null });
        }
        
        // Create user
        const newUser = await User.create({ fullName, email, username, password });
        
        res.render('signup', { 
            success: 'Account created successfully! You can now login.', 
            error: null 
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.render('signup', { 
            error: error.message || 'An error occurred during signup', 
            success: null 
        });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', {
        stats: mockData.stats,
        recentCampaigns: mockData.recentCampaigns,
        user: req.session.user
    });
});

app.get('/users', requireAuth, (req, res) => {
    const allUsers = User.getAllUsers();
    res.render('users', { users: allUsers, currentUser: req.session.user });
});

app.get('/users/new', requireAuth, (req, res) => {
    res.render('user_form', { user: null, currentUser: req.session.user });
});

app.get('/templates', requireAuth, (req, res) => {
    res.render('templates', { templates: mockData.templates, user: req.session.user });
});

app.get('/templates/new', requireAuth, (req, res) => {
    res.render('template_form', { template: null, user: req.session.user });
});

app.get('/campaigns', requireAuth, (req, res) => {
    res.render('campaigns', { campaigns: mockData.campaigns, user: req.session.user });
});

app.get('/campaigns/new', requireAuth, (req, res) => {
    res.render('campaign_form', { templates: mockData.templates, user: req.session.user });
});

// Tracking route (the magic link)
app.get('/track/:campaignId/:userId', (req, res) => {
    const { campaignId, userId } = req.params;
    
    // Log the click (in real app, update database)
    console.log(`User ${userId} clicked campaign ${campaignId} at ${new Date()}`);
    
    // Redirect to phished page
    res.render('phished');
});

// API routes for AJAX calls
app.get('/templates/:id/preview', requireAuth, (req, res) => {
    const template = mockData.templates.find(t => t.id == req.params.id);
    if (template) {
        res.json({
            subject: template.subject,
            body: `<p>This is a preview of the ${template.name} template.</p><p>Click <a href="/track/1/1">here</a> to continue.</p>`
        });
    } else {
        res.status(404).json({ error: 'Template not found' });
    }
});

// User profile route
app.get('/profile', requireAuth, (req, res) => {
    res.json(req.session.user);
});

// Cybersecurity Tools Routes
app.get('/url-scanner', requireAuth, (req, res) => {
    res.render('url_scanner', { user: req.session.user });
});

app.get('/file-scanner', requireAuth, (req, res) => {
    res.render('file_scanner', { user: req.session.user });
});

app.get('/breach-search', requireAuth, (req, res) => {
    res.render('breach_search', { user: req.session.user });
});

app.get('/darkweb-monitor', requireAuth, (req, res) => {
    res.render('darkweb_monitor', { user: req.session.user });
});

// API Routes for Security Tools
app.post('/api/scan-url', requireAuth, async (req, res) => {
    const { url } = req.body;
    // Simulated scan results
    setTimeout(() => {
        res.json({
            safe: Math.random() > 0.3,
            riskScore: Math.floor(Math.random() * 100),
            domainAge: Math.floor(Math.random() * 3650),
            threats: [
                'Domain reputation check: Passed',
                'SSL certificate validation: Valid',
                'Blacklist check: Not found',
                'Phishing detection: No threats detected'
            ]
        });
    }, 2000);
});

app.post('/api/scan-file', requireAuth, async (req, res) => {
    // Simulated file scan
    setTimeout(() => {
        res.json({
            clean: Math.random() > 0.2,
            fileSize: '2.4 MB',
            detections: Math.floor(Math.random() * 5),
            details: [
                'Signature analysis: Complete',
                'Behavioral analysis: No suspicious activity',
                'Heuristic scan: Passed',
                'Sandbox execution: Safe'
            ]
        });
    }, 3000);
});

app.post('/api/breach-search', requireAuth, async (req, res) => {
    const { email } = req.body;
    const breached = Math.random() > 0.5;
    setTimeout(() => {
        res.json({
            breached,
            breachCount: breached ? Math.floor(Math.random() * 5) + 1 : 0,
            lastBreach: breached ? '2023-08-15' : null,
            compromisedData: breached ? ['Email', 'Password', 'Username', 'IP Address'] : [],
            breaches: breached ? [
                { name: 'DataCorp Breach', date: '2023-08-15', records: '50M' },
                { name: 'TechHub Leak', date: '2023-05-20', records: '12M' }
            ] : []
        });
    }, 2500);
});

app.post('/api/darkweb-monitor', requireAuth, async (req, res) => {
    const { domain } = req.body;
    const found = Math.random() > 0.7;
    setTimeout(() => {
        res.json({
            found,
            sourcesScanned: 247,
            alertCount: found ? Math.floor(Math.random() * 3) + 1 : 0,
            findings: found ? [
                { type: 'Credentials', description: 'Email and password found in paste', date: '2024-01-10' },
                { type: 'Database Dump', description: 'User records in leaked database', date: '2023-12-05' }
            ] : []
        });
    }, 3500);
});

app.listen(PORT, () => {
    console.log(`⚡ SecureGuard server running on http://localhost:${PORT}`);
    console.log(`🔐 Default admin: admin / password`);
    console.log(`📝 Or create a new account at /signup`);
});