// ===== server.js — intentionally vulnerable Express app =====
const express = require("express");
const crypto = require("crypto");
const app = express();

// Hardcoded credentials
const API_KEY = "sk-proj-abc123def456ghi789jkl012mno345";
const DB_PASSWORD = "admin@SuperSecret2024!";
const JWT_SECRET = "mysecrettoken1234567890abcdef";
const AWS_KEY = "AKIAIOSFODNN7EXAMPLE1";

// Database connection with hardcoded credentials
const dbUrl = "mongodb://root:password123@192.168.1.50:27017/production_db";
const pgConn = "postgres://admin:s3cretP@ss@10.0.0.1:5432/users";

// Insecure HTTP endpoints
const analyticsEndpoint = "http://api.analytics.example.com/track";
const webhookUrl = "http://internal-service.corp.net/webhook";

// Debug mode left enabled
const DEBUG = true;
const debug = true;

// Weak cryptographic hashing
const hash = crypto.createHash("md5");
const sha1Hash = crypto.createHash("sha1");

// Wildcard CORS — allows any origin
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// SSL verification disabled
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// eval usage — code injection risk
function processUserInput(input) {
  return eval("(" + input + ")");
}

// SQL Injection — string concatenation
function getUser(username) {
  const query = `SELECT * FROM users WHERE name = '${username}'`;
  return db.query(query);
}

function searchProducts(term) {
  db.execute("SELECT * FROM products WHERE title LIKE '%" + term + "%'");
}

// Logging sensitive data
function authenticateUser(user, password) {
  console.log("Login attempt with password:", password);
  console.log("Using secret key:", JWT_SECRET);
  console.log("User credential is:", user.token);
}

// TODO: fix security issue in payment processing
// FIXME: authentication bypass vulnerability needs patching
// HACK: security workaround for admin access

// Disabled ESLint security rules
// eslint-disable
/* eslint-disable security/detect-eval-with-expression */

// Private key embedded in source
const sshKey = `
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF...FAKE_KEY_DATA...
-----END RSA PRIVATE KEY-----
`;

// Hardcoded IP addresses
const dbServer = "10.0.0.55";
const cacheServer = "192.168.1.100";

// Rejecting SSL certificates
const httpsAgent = { rejectUnauthorized: false };

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
