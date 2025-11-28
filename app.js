const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const https = require("https");
require("dotenv").config();
const User = require("./Front-end Files/models/User");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "Front-end Files", "public")));

// Session configuration
app.use(
  session({
    secret: "secureguard-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Front-end Files", "views"));

// Mock data for demonstration
const mockData = {
  stats: {
    totalUsers: 150,
    activeCampaigns: 3,
    clickRate: 23,
    totalTemplates: 8,
  },
  recentCampaigns: [
    {
      id: 1,
      name: "Q4 Security Test",
      status: "Completed",
      sent: 50,
      clicked: 12,
      createdAt: new Date(),
    },
    {
      id: 2,
      name: "New Employee Training",
      status: "Active",
      sent: 25,
      clicked: 5,
      createdAt: new Date(),
    },
  ],
  users: [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@company.com",
      group: "Sales",
    },
    {
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@company.com",
      group: "Engineering",
    },
  ],
  templates: [
    {
      id: 1,
      name: "Fake Password Reset",
      subject: "Urgent: Password Reset Required",
      senderName: "IT Support",
      senderEmail: "it@company.com",
      category: "phishing",
    },
    {
      id: 2,
      name: "Suspicious Invoice",
      subject: "Invoice Payment Required",
      senderName: "Accounting",
      senderEmail: "billing@company.com",
      category: "spear-phishing",
    },
  ],
  campaigns: [
    {
      id: 1,
      name: "Q4 Security Test",
      template: "Fake Password Reset",
      targetGroup: "Sales",
      status: "Completed",
      sent: 50,
      clicked: 12,
    },
    {
      id: 2,
      name: "New Employee Training",
      template: "Suspicious Invoice",
      targetGroup: "Engineering",
      status: "Active",
      sent: 25,
      clicked: 5,
    },
  ],
};

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.authenticated && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Routes
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findByUsername(username);
    if (!user) {
      return res.render("login", { error: "Invalid username or password" });
    }

    const isValidPassword = await User.validatePassword(user, password);
    if (!isValidPassword) {
      return res.render("login", { error: "Invalid username or password" });
    }

    req.session.authenticated = true;
    req.session.user = { ...user, password: undefined };

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    res.render("login", { error: "An error occurred during login" });
  }
});

app.get("/signup", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("signup", { error: null, success: null });
});

app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, username, password, confirmPassword } = req.body;

    if (!fullName || !email || !username || !password) {
      return res.render("signup", {
        error: "All fields are required",
        success: null,
      });
    }

    if (password !== confirmPassword) {
      return res.render("signup", {
        error: "Passwords do not match",
        success: null,
      });
    }

    if (password.length < 6) {
      return res.render("signup", {
        error: "Password must be at least 6 characters long",
        success: null,
      });
    }

    await User.create({ fullName, email, username, password });

    res.render("signup", {
      success: "Account created successfully! You can now login.",
      error: null,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.render("signup", {
      error: error.message || "An error occurred during signup",
      success: null,
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
});

app.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", {
    stats: mockData.stats,
    recentCampaigns: mockData.recentCampaigns,
    user: req.session.user,
  });
});

app.get("/users", requireAuth, (req, res) => {
  const allUsers = User.getAllUsers();
  res.render("users", { users: allUsers, currentUser: req.session.user });
});

app.get("/users/new", requireAuth, (req, res) => {
  res.render("user_form", { user: null, currentUser: req.session.user });
});

app.get("/templates", requireAuth, (req, res) => {
  res.render("templates", {
    templates: mockData.templates,
    user: req.session.user,
  });
});

app.get("/templates/new", requireAuth, (req, res) => {
  res.render("template_form", { template: null, user: req.session.user });
});

app.get("/campaigns", requireAuth, (req, res) => {
  res.render("campaigns", {
    campaigns: mockData.campaigns,
    user: req.session.user,
  });
});

app.get("/campaigns/new", requireAuth, (req, res) => {
  res.render("campaign_form", {
    templates: mockData.templates,
    user: req.session.user,
  });
});

// Tracking route (the magic link)
app.get("/track/:campaignId/:userId", (req, res) => {
  const { campaignId, userId } = req.params;
  console.log(`User ${userId} clicked campaign ${campaignId} at ${new Date()}`);
  res.render("phished");
});

// API routes for AJAX calls
app.get("/templates/:id/preview", requireAuth, (req, res) => {
  const template = mockData.templates.find((t) => t.id == req.params.id);
  if (template) {
    res.json({
      subject: template.subject,
      body: `<p>This is a preview of the ${template.name} template.</p><p>Click <a href="/track/1/1">here</a> to continue.</p>`,
    });
  } else {
    res.status(404).json({ error: "Template not found" });
  }
});

// User profile route
app.get("/profile", requireAuth, (req, res) => {
  res.json(req.session.user);
});

// Cybersecurity Tools Routes
app.get("/url-scanner", requireAuth, (req, res) => {
  res.render("url_scanner", { user: req.session.user });
});

app.get("/file-scanner", requireAuth, (req, res) => {
  res.render("file_scanner", { user: req.session.user });
});

app.get("/breach-search", requireAuth, (req, res) => {
  res.render("breach_search", { user: req.session.user });
});

app.get("/darkweb-monitor", requireAuth, (req, res) => {
  res.render("darkweb_monitor", { user: req.session.user });
});

// API Routes for Security Tools
app.post("/api/scan-url", requireAuth, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Configuration
  const apiKey = "YA02wYDycYZrB7INIfP5d47zryCd3gyr"; // Your Key
  const encodedUrl = encodeURIComponent(url);
  const apiUrl = `https://www.ipqualityscore.com/api/json/url/${apiKey}/${encodedUrl}`;

  console.log(`[Server] Scanning: ${url}`);

  const fetchFromIPQS = () => {
    return new Promise((resolve, reject) => {
      https
        .get(apiUrl, (apiRes) => {
          let data = "";
          apiRes.on("data", (chunk) => (data += chunk));
          apiRes.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error("Failed to parse JSON response"));
            }
          });
        })
        .on("error", (err) => reject(err));
    });
  };

  try {
    const apiData = await fetchFromIPQS();

    // Handle API Logic Failures (Quota/Key issues)
    if (apiData.success === false) {
      console.error("[Server] API Error:", apiData.message);
      return res.json({
        success: false,
        error: apiData.message || "API Key invalid or limit reached",
      });
    }

    // --- DATA MAPPING ---

    // 1. Safely extract Domain Age
    let age = "Unknown";
    if (apiData.domain_age && apiData.domain_age.human) {
      age = apiData.domain_age.human;
    }

    // 2. Map the verdict
    const isUnsafe = apiData.unsafe || apiData.phishing || apiData.malware;

    // 3. Construct the response object matching your EJS variables
    const responseData = {
      success: true,

      // Verdict
      unsafe: isUnsafe,
      risk_score: apiData.risk_score || 0,

      // Domain Info
      domain: apiData.domain || url,
      domain_age: apiData.domain_age?.human || "Unknown",
      dns_valid: apiData.dns_valid === true,
      category: apiData.category || "Uncategorized",

      // Server Info
      ip_address: apiData.ip_address || "N/A",
      country_code: apiData.country_code || "N/A",
      server: apiData.server || "Unknown",
      status_code: apiData.status_code || "N/A",

      // Threats Object (Used for your badges)
      threats: {
        phishing: apiData.phishing === true,
        malware: apiData.malware === true,
        spamming: apiData.spamming === true,
        suspicious: apiData.suspicious === true,
        adult: apiData.adult === true,
      },
    };

    console.log(`[Server] Success. Risk Score: ${responseData.risk_score}`);
    res.json(responseData);
  } catch (error) {
    console.error("[Server] Critical Error:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post("/api/scan-file", requireAuth, async (req, res) => {
  setTimeout(() => {
    res.json({
      clean: Math.random() > 0.2,
      fileSize: "2.4 MB",
      detections: Math.floor(Math.random() * 5),
      details: [
        "Signature analysis: Complete",
        "Behavioral analysis: No suspicious activity",
        "Heuristic scan: Passed",
        "Sandbox execution: Safe",
      ],
    });
  }, 3000);
});

app.post("/api/breach-search", requireAuth, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // 1. Configuration
  const apiKey = "YA02wYDycYZrB7INIfP5d47zryCd3gyr";
  const apiUrl = `https://www.ipqualityscore.com/api/json/email/${apiKey}/${email}`;

  console.log(`[Server] Verifying Email: ${email}`);

  // 2. Promise Wrapper for HTTPS Request
  const fetchEmailData = () => {
    return new Promise((resolve, reject) => {
      https
        .get(apiUrl, (apiRes) => {
          let data = "";
          apiRes.on("data", (chunk) => (data += chunk));
          apiRes.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error("Failed to parse API response"));
            }
          });
        })
        .on("error", (err) => reject(err));
    });
  };

  try {
    // 3. Fetch Data
    const apiData = await fetchEmailData();

    if (apiData.success === false) {
      console.error("[Server] API Error:", apiData.message);
      return res.json({
        success: false,
        error: apiData.message || "Invalid API Key or Quota Exceeded",
      });
    }

    // 4. Construct Response (Mapping IPQS fields to Frontend)
    const responseData = {
      success: true,

      // Core Validity
      valid: apiData.valid,
      disposable: apiData.disposable,
      deliverability: apiData.deliverability || "unknown",

      // Security & Fraud
      fraud_score: apiData.fraud_score || 0,
      leaked: apiData.leaked || false, // The "Breach" check
      recent_abuse: apiData.recent_abuse || false,
      honeypot: apiData.honeypot || false,

      // Metadata
      email: email,
      domain_age: apiData.domain_age?.human || "Unknown",
      first_seen: apiData.first_seen?.human || "Unknown",

      // Raw data for debug
      requestId: apiData.request_id,
    };

    console.log(
      `[Server] Email Scanned. Valid: ${responseData.valid}, Score: ${responseData.fraud_score}`
    );
    res.json(responseData);
  } catch (error) {
    console.error("[Server] Critical Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/darkweb-monitor", requireAuth, async (req, res) => {
  const { data, type } = req.body;

  if (!data) {
    return res.status(400).json({ error: "Search data is required" });
  }

  // 1. Configuration
  const apiKey = "YA02wYDycYZrB7INIfP5d47zryCd3gyr";
  const searchType = type || "email"; // Default to email if not specified
  const encodedData = encodeURIComponent(data);
  const apiUrl = `https://www.ipqualityscore.com/api/json/leaked/${searchType}/${apiKey}/${encodedData}`;

  console.log(`[Server] Dark Web Scan: ${searchType} -> ${data}`);

  // 2. Promise Wrapper
  const fetchLeakData = () => {
    return new Promise((resolve, reject) => {
      https
        .get(apiUrl, (apiRes) => {
          let raw = "";
          apiRes.on("data", (chunk) => (raw += chunk));
          apiRes.on("end", () => {
            try {
              resolve(JSON.parse(raw));
            } catch (e) {
              reject(new Error("Failed to parse API response"));
            }
          });
        })
        .on("error", (err) => reject(err));
    });
  };

  try {
    // 3. Execute Request
    const apiData = await fetchLeakData();

    if (apiData.success === false) {
      console.error("[Server] API Error:", apiData.message);
      // Return success: false but with error message to display on frontend
      return res.json({
        success: false,
        error: apiData.message || "Quota Exceeded or Invalid Key",
      });
    }

    // 4. Construct Response
    // IPQS Leaked API structure: { success: true, leaked: true/false, results: [...] }
    const responseData = {
      success: true,
      leaked: apiData.leaked || false,
      query: data,
      search_type: searchType,
      records_count: apiData.results ? apiData.results.length : 0,
      results: apiData.results || [], // Array of breach objects
      requestId: apiData.request_id,
    };

    console.log(
      `[Server] Leak Status: ${responseData.leaked}, Records: ${responseData.records_count}`
    );
    res.json(responseData);
  } catch (error) {
    console.error("[Server] Critical Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ SecureGuard server running on http://localhost:${PORT}`);
  console.log(`🔐 Default admin: admin / password`);
  console.log(`📝 Or create a new account at /signup`);
});
