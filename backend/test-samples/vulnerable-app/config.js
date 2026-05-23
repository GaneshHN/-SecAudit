// Sample file with intentional security vulnerabilities for testing
const API_KEY = "sk-1234567890abcdef1234567890abcdef";
const password = "SuperSecret123!";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";

const dbUrl = "mongodb://admin:password123@192.168.1.100:27017/mydb";

const http_endpoint = "http://api.example.com/data";

const crypto = require("crypto");
const hash = crypto.createHash("md5");

// TODO: fix security vulnerability in auth module
const debug = true;

function queryUser(username) {
  const sql = `SELECT * FROM users WHERE name = '${username}'`;
  db.query(sql);
}

eval("console.log('hello')");

console.log("User password is:", password);
