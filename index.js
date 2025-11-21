const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
// To parse form data and JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (CSS, Images, Client-side JS)
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Mock Data (Simulating Database) ---
// This represents user progress for the "Risk Dashboard"
const userStats = {
  phishingAttempts: 12,
  caughtInPhishing: 2,
  reportedEmails: 10,
  riskScore: 85, // 0-100
  badges: ["Cyber Guardian", "Email Scout"],
};

// --- ROUTES: Page Rendering ---

// 1. Home Page
app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

// 2. Fraud Shield Page
app.get("/fraud-detection", (req, res) => {
  res.render("fraud-detection", { title: "Fraud Shield" });
});

// 3. Phishing Simulator Page
app.get("/phishing-sim", (req, res) => {
  res.render("phishing-sim", { title: "Phishing Simulator" });
});

// 4. AI URL Checker Page
app.get("/url-checker", (req, res) => {
  res.render("url-checker", { title: "AI URL Checker", result: null });
});

// 5. Risk Dashboard (Passes backend data to the view)
app.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    title: "User Dashboard",
    stats: userStats,
  });
});

// 6. Gamified Training Page
app.get("/training", (req, res) => {
  res.render("training", { title: "Training Module" });
});

// 7. Login Page
app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

// --- LOGIC & API ENDPOINTS (The Backend "Brains") ---

// Logic: AI URL Checker (Simulation)
// This analyzes a link submitted by the user
app.post("/api/check-url", (req, res) => {
  const { url } = req.body;

  let riskLevel = "Safe";
  let analysis = "No threats detected.";
  let score = 95; // Safety score

  // Simple heuristic simulation for demonstration
  // In a real app, this would connect to an AI Model or VirusTotal API
  const suspiciousPatterns = [
    "http://",
    "login",
    "verify",
    "bank",
    "free-gift",
  ];

  const isSuspicious = suspiciousPatterns.some((pattern) =>
    url.toLowerCase().includes(pattern)
  );

  if (isSuspicious) {
    riskLevel = "High Risk";
    analysis =
      "Potential Phishing detected. URL uses HTTP or suspicious keywords.";
    score = 20;
  }

  // If it's an AJAX request, send JSON, otherwise render page
  if (req.xhr || req.headers.accept.indexOf("json") > -1) {
    res.json({ riskLevel, analysis, score });
  } else {
    res.render("url-checker", {
      title: "AI URL Checker",
      result: { url, riskLevel, analysis, score },
    });
  }
});

// Logic: Phishing Click Tracker
// This tracks if a user fell for a simulation
app.get("/simulate-click", (req, res) => {
  // Update mock database
  userStats.caughtInPhishing += 1;
  userStats.riskScore -= 10;

  console.log(
    `User clicked a phishing link! Current Risk Score: ${userStats.riskScore}`
  );

  // Redirect to a "You got caught" educational page
  res.send(`
        <h1>Oops! That was a phishing simulation.</h1>
        <p>You just clicked a suspicious link. In a real attack, your data would be stolen.</p>
        <a href="/dashboard">Return to Dashboard</a>
    `);
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`SurakshitRahe server is running on http://localhost:${PORT}`);
});
