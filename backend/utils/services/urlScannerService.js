const https = require("https");
const http = require("http");
const { URL } = require("url");

/** Timeout for URL checks */
const CHECK_TIMEOUT_MS = 15_000;

/**
 * Perform a security scan on a website URL.
 * Checks: SSL, security headers, redirects, cookies, and more.
 */
async function scanUrl(targetUrl) {
  const startTime = performance.now();
  const issues = [];
  const info = { url: targetUrl, finalUrl: targetUrl, redirects: 0 };

  // Normalize the URL
  let parsedUrl;
  try {
    if (!targetUrl.match(/^https?:\/\//)) {
      targetUrl = "https://" + targetUrl;
    }
    parsedUrl = new URL(targetUrl);
    info.url = targetUrl;
    info.host = parsedUrl.hostname;
  } catch {
    return buildResult(targetUrl, issues, info, startTime, "Invalid URL format.");
  }

  // ── Check 1: Is it using HTTPS? ──
  if (parsedUrl.protocol === "http:") {
    issues.push({
      issue: "Insecure HTTP Connection",
      severity: "High",
      category: "Transport Security",
      owasp: "A02:2021 - Cryptographic Failures",
      file: parsedUrl.hostname,
      line: 0,
      snippet: targetUrl,
      description: "The URL uses HTTP instead of HTTPS. All data transmitted is unencrypted and can be intercepted by attackers (man-in-the-middle attack).",
      fix: "Switch to HTTPS. Obtain a TLS certificate (free via Let's Encrypt) and enforce HTTPS with HSTS.",
    });
  }

  // ── Fetch the URL and analyze response ──
  try {
    const response = await fetchUrlWithRedirects(targetUrl);
    info.statusCode = response.statusCode;
    info.finalUrl = response.finalUrl;
    info.redirects = response.redirectCount;
    info.responseTimeMs = response.responseTimeMs;

    const headers = response.headers;

    // ── Check 2: SSL Certificate ──
    if (response.tlsInfo) {
      const tls = response.tlsInfo;
      if (tls.valid === false) {
        issues.push({
          issue: "Invalid SSL Certificate",
          severity: "High",
          category: "Transport Security",
          owasp: "A02:2021 - Cryptographic Failures",
          file: parsedUrl.hostname,
          line: 0,
          snippet: `Certificate issuer: ${tls.issuer || "unknown"}`,
          description: "The SSL/TLS certificate is invalid, expired, or self-signed. Browsers will show security warnings and attackers can intercept traffic.",
          fix: "Install a valid SSL certificate. Use Let's Encrypt for free certificates. Ensure the certificate matches the domain.",
        });
      }
    }

    // ── Check 3: Security Headers ──
    checkSecurityHeader(headers, "strict-transport-security", {
      name: "Missing HSTS Header",
      severity: "High",
      category: "Security Headers",
      owasp: "A05:2021 - Security Misconfiguration",
      description: "Strict-Transport-Security header is missing. Browsers may allow HTTP connections, exposing users to downgrade attacks.",
      fix: "Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
    }, issues, parsedUrl.hostname);

    checkSecurityHeader(headers, "content-security-policy", {
      name: "Missing Content-Security-Policy",
      severity: "Medium",
      category: "Security Headers",
      owasp: "A05:2021 - Security Misconfiguration",
      description: "No Content-Security-Policy (CSP) header found. Without CSP, the site is more vulnerable to XSS attacks.",
      fix: "Add a Content-Security-Policy header. Start with: Content-Security-Policy: default-src 'self'",
    }, issues, parsedUrl.hostname);

    checkSecurityHeader(headers, "x-content-type-options", {
      name: "Missing X-Content-Type-Options",
      severity: "Medium",
      category: "Security Headers",
      owasp: "A05:2021 - Security Misconfiguration",
      description: "X-Content-Type-Options header is missing. Browsers may MIME-sniff responses, potentially executing malicious content.",
      fix: "Add header: X-Content-Type-Options: nosniff",
    }, issues, parsedUrl.hostname);

    checkSecurityHeader(headers, "x-frame-options", {
      name: "Missing X-Frame-Options (Clickjacking)",
      severity: "Medium",
      category: "Security Headers",
      owasp: "A05:2021 - Security Misconfiguration",
      description: "X-Frame-Options header is missing. The site can be embedded in iframes, enabling clickjacking attacks.",
      fix: "Add header: X-Frame-Options: DENY or SAMEORIGIN",
    }, issues, parsedUrl.hostname);

    checkSecurityHeader(headers, "x-xss-protection", {
      name: "Missing X-XSS-Protection",
      severity: "Low",
      category: "Security Headers",
      owasp: "A05:2021 - Security Misconfiguration",
      description: "X-XSS-Protection header is missing. While deprecated in modern browsers, it provides a layer for older ones.",
      fix: "Add header: X-XSS-Protection: 1; mode=block",
    }, issues, parsedUrl.hostname);

    checkSecurityHeader(headers, "referrer-policy", {
      name: "Missing Referrer-Policy",
      severity: "Low",
      category: "Security Headers",
      owasp: "A05:2021 - Security Misconfiguration",
      description: "No Referrer-Policy set. Full referrer URLs may leak sensitive data to third-party sites.",
      fix: "Add header: Referrer-Policy: strict-origin-when-cross-origin",
    }, issues, parsedUrl.hostname);

    checkSecurityHeader(headers, "permissions-policy", {
      name: "Missing Permissions-Policy",
      severity: "Low",
      category: "Security Headers",
      owasp: "A05:2021 - Security Misconfiguration",
      description: "No Permissions-Policy (formerly Feature-Policy) header. Browser features like camera, mic, geolocation are unrestricted.",
      fix: "Add header: Permissions-Policy: camera=(), microphone=(), geolocation=()",
    }, issues, parsedUrl.hostname);

    // ── Check 4: Server Information Disclosure ──
    const serverHeader = headers["server"];
    if (serverHeader && /\d/.test(serverHeader)) {
      issues.push({
        issue: "Server Version Disclosed",
        severity: "Low",
        category: "Information Disclosure",
        owasp: "A05:2021 - Security Misconfiguration",
        file: parsedUrl.hostname,
        line: 0,
        snippet: `Server: ${serverHeader}`,
        description: `The Server header reveals version info (${serverHeader}). Attackers can target known vulnerabilities for that version.`,
        fix: "Remove or genericize the Server header. In nginx: server_tokens off; In Apache: ServerTokens Prod",
      });
    }

    const poweredBy = headers["x-powered-by"];
    if (poweredBy) {
      issues.push({
        issue: "X-Powered-By Header Exposed",
        severity: "Low",
        category: "Information Disclosure",
        owasp: "A05:2021 - Security Misconfiguration",
        file: parsedUrl.hostname,
        line: 0,
        snippet: `X-Powered-By: ${poweredBy}`,
        description: `The X-Powered-By header reveals the technology stack (${poweredBy}). This helps attackers target framework-specific vulnerabilities.`,
        fix: "Remove the X-Powered-By header. In Express: app.disable('x-powered-by') or use helmet.",
      });
    }

    // ── Check 5: Cookie Security ──
    const cookies = headers["set-cookie"];
    if (cookies) {
      const cookieList = Array.isArray(cookies) ? cookies : [cookies];
      for (const cookie of cookieList) {
        const cookieName = cookie.split("=")[0].trim();
        if (!cookie.toLowerCase().includes("secure")) {
          issues.push({
            issue: "Cookie Missing Secure Flag",
            severity: "Medium",
            category: "Cookie Security",
            owasp: "A07:2021 - Identification Failures",
            file: parsedUrl.hostname,
            line: 0,
            snippet: `Cookie: ${cookieName}`,
            description: `Cookie '${cookieName}' is missing the Secure flag. It will be sent over unencrypted HTTP connections.`,
            fix: "Set the Secure flag on all cookies: Set-Cookie: name=value; Secure",
          });
        }
        if (!cookie.toLowerCase().includes("httponly")) {
          issues.push({
            issue: "Cookie Missing HttpOnly Flag",
            severity: "Medium",
            category: "Cookie Security",
            owasp: "A07:2021 - Identification Failures",
            file: parsedUrl.hostname,
            line: 0,
            snippet: `Cookie: ${cookieName}`,
            description: `Cookie '${cookieName}' is missing the HttpOnly flag. JavaScript can access it, making it vulnerable to XSS theft.`,
            fix: "Set the HttpOnly flag on session cookies: Set-Cookie: name=value; HttpOnly",
          });
        }
        if (!cookie.toLowerCase().includes("samesite")) {
          issues.push({
            issue: "Cookie Missing SameSite Attribute",
            severity: "Low",
            category: "Cookie Security",
            owasp: "A01:2021 - Broken Access Control",
            file: parsedUrl.hostname,
            line: 0,
            snippet: `Cookie: ${cookieName}`,
            description: `Cookie '${cookieName}' has no SameSite attribute. It may be sent in cross-site requests, enabling CSRF.`,
            fix: "Add SameSite attribute: Set-Cookie: name=value; SameSite=Lax",
          });
        }
      }
    }

    // ── Check 6: HTTP to HTTPS Redirect ──
    if (parsedUrl.protocol === "https:" && response.httpRedirectsToHttps === false) {
      issues.push({
        issue: "HTTP Does Not Redirect to HTTPS",
        severity: "Medium",
        category: "Transport Security",
        owasp: "A02:2021 - Cryptographic Failures",
        file: parsedUrl.hostname,
        line: 0,
        snippet: `http://${parsedUrl.hostname}`,
        description: "The HTTP version of the site does not redirect to HTTPS. Users who visit via HTTP are not protected.",
        fix: "Configure a 301 redirect from HTTP to HTTPS. Add HSTS header to enforce future HTTPS.",
      });
    }

    // ── Check 7: Mixed Content Indicators ──
    if (response.body) {
      const bodyLower = response.body.toLowerCase();
      const mixedContentPatterns = [
        /src=["']http:\/\//g,
        /href=["']http:\/\/(?!localhost)/g,
        /action=["']http:\/\//g,
      ];
      for (const pattern of mixedContentPatterns) {
        if (pattern.test(bodyLower)) {
          issues.push({
            issue: "Mixed Content Detected",
            severity: "Medium",
            category: "Transport Security",
            owasp: "A02:2021 - Cryptographic Failures",
            file: parsedUrl.hostname,
            line: 0,
            snippet: "HTTP resources loaded on HTTPS page",
            description: "The HTTPS page loads resources over HTTP (mixed content). This weakens the security of the HTTPS connection.",
            fix: "Use HTTPS for all resource URLs. Use protocol-relative URLs or Content-Security-Policy: upgrade-insecure-requests.",
          });
          break;
        }
      }
    }

    // ── Check 8: Open Redirects in Response ──
    if (response.redirectCount > 3) {
      issues.push({
        issue: "Excessive Redirects",
        severity: "Low",
        category: "Configuration",
        owasp: "A05:2021 - Security Misconfiguration",
        file: parsedUrl.hostname,
        line: 0,
        snippet: `${response.redirectCount} redirects followed`,
        description: `The URL resulted in ${response.redirectCount} redirects. This may indicate misconfiguration or redirect loops.`,
        fix: "Minimize redirect chains. Use direct URLs and ensure canonical redirect configuration.",
      });
    }

  } catch (err) {
    if (err.code === "CERT_HAS_EXPIRED" || err.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" || err.code === "ERR_TLS_CERT_ALTNAME_INVALID") {
      issues.push({
        issue: "SSL Certificate Error",
        severity: "High",
        category: "Transport Security",
        owasp: "A02:2021 - Cryptographic Failures",
        file: parsedUrl.hostname,
        line: 0,
        snippet: `Error: ${err.code}`,
        description: `SSL certificate error: ${err.message}. The site's certificate cannot be verified.`,
        fix: "Renew or replace the SSL certificate. Ensure it matches the domain and is issued by a trusted CA.",
      });
    } else if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      return buildResult(targetUrl, issues, info, startTime, `Cannot connect to ${parsedUrl.hostname}: ${err.code}`);
    } else {
      issues.push({
        issue: "Connection Error",
        severity: "Medium",
        category: "Availability",
        owasp: "A05:2021 - Security Misconfiguration",
        file: parsedUrl.hostname,
        line: 0,
        snippet: `Error: ${err.message}`,
        description: `Failed to connect: ${err.message}`,
        fix: "Verify the URL is correct and the server is running.",
      });
    }
  }

  return buildResult(targetUrl, issues, info, startTime);
}

// ─── Helper: check if a security header exists ───────────────
function checkSecurityHeader(headers, headerName, meta, issues, hostname) {
  if (!headers[headerName]) {
    issues.push({
      issue: meta.name,
      severity: meta.severity,
      category: meta.category,
      owasp: meta.owasp,
      file: hostname,
      line: 0,
      snippet: `Missing: ${headerName}`,
      description: meta.description,
      fix: meta.fix,
    });
  }
}

// ─── Helper: fetch URL following redirects ────────────────────
function fetchUrlWithRedirects(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error("Too many redirects"));

    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;
    const startMs = performance.now();

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      timeout: CHECK_TIMEOUT_MS,
      headers: {
        "User-Agent": "SecAudit-URLScanner/2.0",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      rejectUnauthorized: true,
    };

    const req = client.request(options, (res) => {
      const responseTimeMs = Math.round(performance.now() - startMs);

      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith("/")) {
          nextUrl = `${parsedUrl.protocol}//${parsedUrl.host}${nextUrl}`;
        }
        return fetchUrlWithRedirects(nextUrl, redirectCount + 1)
          .then((result) => {
            result.redirectCount = (result.redirectCount || 0) + 1;
            resolve(result);
          })
          .catch(reject);
      }

      // Read body (limited to first 50KB for header/mixed-content checks)
      const chunks = [];
      let bytesRead = 0;
      const maxBytes = 50 * 1024;

      res.on("data", (chunk) => {
        bytesRead += chunk.length;
        if (bytesRead <= maxBytes) chunks.push(chunk);
      });

      res.on("end", () => {
        // Extract TLS info if available
        let tlsInfo = null;
        if (res.socket && res.socket.getPeerCertificate) {
          try {
            const cert = res.socket.getPeerCertificate();
            if (cert && cert.subject) {
              tlsInfo = {
                valid: res.socket.authorized,
                issuer: cert.issuer?.O || cert.issuer?.CN || "unknown",
                subject: cert.subject?.CN || "unknown",
                validTo: cert.valid_to,
              };
            }
          } catch { /* ignore */ }
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          finalUrl: url,
          redirectCount: redirectCount,
          responseTimeMs,
          body: Buffer.concat(chunks).toString("utf-8"),
          tlsInfo,
        });
      });

      res.on("error", reject);
    });

    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    req.on("error", reject);
    req.end();
  });
}

// ─── Build the result object ──────────────────────────────────
function buildResult(url, issues, info, startTime, errorMsg) {
  const scanDuration = ((performance.now() - startTime) / 1000).toFixed(2);

  // Sort by severity
  const severityOrder = { High: 0, Medium: 1, Low: 2 };
  issues.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  // Calculate score
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case "High": score -= 20; break;
      case "Medium": score -= 10; break;
      case "Low": score -= 5; break;
    }
  }
  score = Math.max(0, Math.min(100, score));

  let high = 0, medium = 0, low = 0;
  for (const issue of issues) {
    switch (issue.severity) {
      case "High": high++; break;
      case "Medium": medium++; break;
      case "Low": low++; break;
    }
  }

  return {
    score,
    summary: { high, medium, low },
    totalIssues: issues.length,
    filesScanned: 1,
    scanTime: `${scanDuration}s`,
    scanType: "url",
    urlInfo: info,
    message: errorMsg || `URL security scan completed in ${scanDuration}s`,
    issues,
  };
}

module.exports = { scanUrl };
