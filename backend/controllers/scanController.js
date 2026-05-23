const { fetchAndExtractRepo, extractUploadedArchive, placeSingleFile, cleanup } = require("../utils/services/repoService");
const { runScan } = require("../utils/services/scannerService");
const { scanUrl } = require("../utils/services/urlScannerService");
const fs = require("fs/promises");
const path = require("path");
const Scan = require("../models/Scan");

/** Archive extensions that need extraction */
const ARCHIVE_EXTENSIONS = new Set([".zip", ".tar", ".gz", ".tgz", ".rar", ".7z", ".bz2"]);

/** Git hosting platforms we know how to download from */
const GIT_HOSTS = ["github.com", "gitlab.com", "gitlab.", "bitbucket.org"];

/**
 * Determine if a URL points to a Git repository or a generic website.
 */
function classifyUrl(rawUrl) {
  const url = rawUrl.trim();

  // SSH format always a git repo
  if (/^git@/.test(url)) return "repo";

  // Shorthand owner/repo always a git repo
  if (/^[\w.-]+\/[\w.-]+$/.test(url) && !url.includes(".")) return "repo";

  // Ends with .git always a repo
  if (url.endsWith(".git")) return "repo";

  // Check if it's a known git host with owner/repo path
  try {
    let checkUrl = url;
    if (!/^https?:\/\//.test(checkUrl)) checkUrl = "https://" + checkUrl;
    const parsed = new URL(checkUrl);
    const host = parsed.hostname.toLowerCase();

    if (GIT_HOSTS.some((gh) => host.includes(gh))) {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) return "repo";
    }
  } catch {
    // not a valid URL
  }

  // Everything else is a website URL scan
  return "url";
}

/**
 * Normalize any Git URL to HTTPS format.
 */
function normalizeGitUrl(rawUrl) {
  let url = rawUrl.trim();

  // SSH format: git@host:user/repo.git
  const sshMatch = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return { url: "https://" + sshMatch[1] + "/" + sshMatch[2], host: sshMatch[1] };
  }

  // Just owner/repo (assume GitHub)
  const shortMatch = url.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (shortMatch) {
    return { url: "https://github.com/" + shortMatch[1] + "/" + shortMatch[2], host: "github.com" };
  }

  // Parse as URL
  try {
    let checkUrl = url;
    if (!/^https?:\/\//.test(checkUrl)) checkUrl = "https://" + checkUrl;
    const parsed = new URL(checkUrl);
    const cleanUrl = checkUrl.replace(/\.git$/, "").replace(/\/$/, "");
    return { url: cleanUrl, host: parsed.hostname };
  } catch {
    return null;
  }
}

/**
 * POST /api/scan
 * Accepts: repoUrl (body) or file (multipart upload).
 * Auto-detects whether a URL is a git repo or a website to scan.
 */
async function handleScan(req, res) {
  const { repoUrl, userId } = req.body;
  const file = req.file;

  if (repoUrl && file) {
    return res.status(400).json({ error: "Provide either a URL or a file upload, not both." });
  }
  if (!repoUrl && !file) {
    return res.status(400).json({ error: "Provide a URL or upload a file to scan." });
  }

  let projectDir = null;

  try {
    if (repoUrl) {
      const urlType = classifyUrl(repoUrl);
      console.log("🔍 Input classified as: " + urlType + " → " + repoUrl);

      if (urlType === "url") {
        // Website URL scan
        const results = await scanUrl(repoUrl);
        console.log("🌐 URL scan complete: " + results.totalIssues + " issues, score " + results.score + "/100");
        if (userId) {
          await Scan.create({
            userId,
            repoUrl,
            totalIssues: results.totalIssues,
            highCount: results.summary?.high || 0,
            mediumCount: results.summary?.medium || 0,
            lowCount: results.summary?.low || 0,
            securityScore: results.score,
            results: results.issues || [],
          });
        }
        return res.json(results);
      }

      // Git repository scan
      const normalized = normalizeGitUrl(repoUrl);
      if (!normalized) {
        return res.status(400).json({
          error: "Could not parse the URL. Supported: GitHub, GitLab, Bitbucket repos, or any website URL.",
        });
      }
      projectDir = await fetchAndExtractRepo(normalized.url, normalized.host);
    } else {
      const ext = path.extname(file.originalname).toLowerCase();
      const isArchive = ARCHIVE_EXTENSIONS.has(ext) || file.originalname.toLowerCase().endsWith(".tar.gz");

      if (isArchive) {
        projectDir = await extractUploadedArchive(file.path);
      } else {
        projectDir = await placeSingleFile(file.path, file.originalname);
      }
      await fs.unlink(file.path).catch(function() {});
    }

    const results = await runScan(projectDir);
    if (userId) {
      await Scan.create({
        userId,
        repoUrl: repoUrl || file.originalname,
        totalIssues: results.totalIssues,
        highCount: results.summary?.high || 0,
        mediumCount: results.summary?.medium || 0,
        lowCount: results.summary?.low || 0,
        securityScore: results.score,
        results: results.issues || [],
      });
    }
    res.json(results);
  } catch (err) {
    console.error("Scan error:", err.message);
    const status = err.message.includes("Invalid") ? 400 : 500;
    res.status(status).json({ error: err.message || "An unexpected error occurred during scanning." });
  } finally {
    if (projectDir) {
      const parts = projectDir.split("secaudit-");
      const parentDir = parts.length > 1
        ? parts[0] + "secaudit-" + parts[1].split(/[/\\]/)[0]
        : projectDir;
      await cleanup(parentDir);
    }
  }
}

module.exports = { handleScan };
