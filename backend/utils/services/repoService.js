const fs = require("fs/promises");
const path = require("path");
const https = require("https");
const http = require("http");
const AdmZip = require("adm-zip");
const os = require("os");
const crypto = require("crypto");

// ─── Temp directory management ────────────────────────────────

function getTempDir() {
  const id = crypto.randomBytes(8).toString("hex");
  return path.join(os.tmpdir(), `secaudit-${id}`);
}

// ─── Optimized download with streaming and timeout ────────────

/** Download timeout: 30 seconds */
const DOWNLOAD_TIMEOUT_MS = 120_000;

/** Max download size: 500 MB */
const MAX_DOWNLOAD_BYTES = 500 * 1024 * 1024;

function downloadFile(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error("Too many redirects"));

    const client = url.startsWith("https") ? https : http;

    const req = client.get(
      url,
      { headers: { "User-Agent": "SecAudit-Scanner/2.0" }, timeout: DOWNLOAD_TIMEOUT_MS },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume(); // drain the response
          return resolve(downloadFile(res.headers.location, redirectCount + 1));
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`Download failed with status ${res.statusCode}`));
        }

        // Stream into preallocated buffer chunks
        let totalBytes = 0;
        const chunks = [];

        res.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_DOWNLOAD_BYTES) {
            res.destroy();
            return reject(new Error(`Download exceeds ${MAX_DOWNLOAD_BYTES / 1024 / 1024}MB limit`));
          }
          chunks.push(chunk);
        });

        res.on("end", () => resolve(Buffer.concat(chunks, totalBytes)));
        res.on("error", reject);
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Download timed out"));
    });

    req.on("error", reject);
  });
}

// ─── Git platform URL resolution ──────────────────────────────

function getZipUrl(repoUrl, host) {
  const cleaned = repoUrl.trim().replace(/\.git$/, "").replace(/\/$/, "");

  if (host.includes("github.com")) {
    const treeMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/(.+)/);
    if (treeMatch) {
      const [, owner, repo, branch] = treeMatch;
      return { primary: `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`, fallback: null };
    }
    const repoMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (repoMatch) {
      const [, owner, repo] = repoMatch;
      return {
        primary: `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`,
        fallback: `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`,
      };
    }
  }

  if (host.includes("gitlab")) {
    const match = cleaned.match(/gitlab\.[^/]+\/(.+)/);
    if (match) {
      const projectPath = match[1];
      const name = projectPath.split("/").pop();
      return {
        primary: `https://${host}/${projectPath}/-/archive/main/${name}-main.zip`,
        fallback: `https://${host}/${projectPath}/-/archive/master/${name}-master.zip`,
      };
    }
  }

  if (host.includes("bitbucket")) {
    const match = cleaned.match(/bitbucket\.org\/([^/]+)\/([^/]+)/);
    if (match) {
      const [, owner, repo] = match;
      return {
        primary: `https://bitbucket.org/${owner}/${repo}/get/main.zip`,
        fallback: `https://bitbucket.org/${owner}/${repo}/get/master.zip`,
      };
    }
  }

  throw new Error("Could not determine download URL. Supported: GitHub, GitLab, Bitbucket.");
}

// ─── Extraction ───────────────────────────────────────────────

async function extractZipBuffer(buffer, tempDir) {
  await fs.mkdir(tempDir, { recursive: true });

  const zip = new AdmZip(buffer);
  zip.extractAllTo(tempDir, true);

  // GitHub ZIPs have a single root folder — unwrap it
  const entries = await fs.readdir(tempDir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());
  return dirs.length === 1 ? path.join(tempDir, dirs[0].name) : tempDir;
}

async function fetchAndExtractRepo(repoUrl, host) {
  const { primary, fallback } = getZipUrl(repoUrl, host);
  const tempDir = getTempDir();

  console.log(`📥 Downloading from: ${primary}`);

  let buffer;
  try {
    buffer = await downloadFile(primary);
  } catch (err) {
    if (fallback) {
      console.log(`⚠️  Primary failed, trying fallback: ${fallback}`);
      buffer = await downloadFile(fallback);
    } else {
      throw err;
    }
  }

  console.log(`📦 Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
  return extractZipBuffer(buffer, tempDir);
}

async function extractUploadedArchive(filePath) {
  const tempDir = getTempDir();
  const buffer = await fs.readFile(filePath);
  console.log(`📦 Extracting archive (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  return extractZipBuffer(buffer, tempDir);
}

async function placeSingleFile(filePath, originalName) {
  const tempDir = getTempDir();
  await fs.mkdir(tempDir, { recursive: true });
  await fs.copyFile(filePath, path.join(tempDir, originalName));
  console.log(`📄 Placed single file: ${originalName}`);
  return tempDir;
}

// ─── Cleanup ──────────────────────────────────────────────────

async function cleanup(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    console.log(`🧹 Cleaned up temp directory`);
  } catch {
    // Best-effort
  }
}

module.exports = { fetchAndExtractRepo, extractUploadedArchive, placeSingleFile, cleanup };
