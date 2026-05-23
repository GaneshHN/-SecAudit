const fs = require("fs/promises");
const path = require("path");

// ─── Directories to always skip ───────────────────────────────
const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "__pycache__",
  ".venv", "venv", ".cache", "coverage", ".nyc_output", "vendor",
  ".idea", ".vs", ".vscode", "bin", "obj", ".gradle", "target",
  ".terraform", ".serverless", ".angular", ".nuxt", "bower_components",
  ".parcel-cache", ".turbo", ".svelte-kit",
]);

// ─── Binary extensions (skip on sight — no I/O needed) ────────
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg", ".webp", ".avif",
  ".mp3", ".mp4", ".avi", ".mov", ".mkv", ".flv", ".wav", ".ogg", ".webm",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".zip", ".tar", ".gz", ".rar", ".7z", ".bz2", ".xz", ".tgz",
  ".exe", ".dll", ".so", ".dylib", ".bin", ".dat", ".img", ".iso",
  ".pyc", ".pyo", ".class", ".o", ".obj", ".a", ".lib",
  ".lock", ".map",
  ".sqlite", ".db", ".mdb",
  ".DS_Store", ".min.js", ".min.css",
]);

// ─── Priority extensions (scanned first — most likely to have issues) ──
const PRIORITY_EXTENSIONS = new Set([
  ".js", ".ts", ".jsx", ".tsx", ".py", ".rb", ".php",
  ".java", ".go", ".rs", ".c", ".cpp", ".h", ".cs",
  ".env", ".sh", ".bash", ".yml", ".yaml", ".toml",
  ".json", ".xml", ".tf", ".hcl",
  ".html", ".htm", ".sql",
  "Dockerfile", "docker-compose.yml",
]);

/** Max file size per file — 1 MB (larger files are rarely source code) */
const MAX_FILE_SIZE = 1 * 1024 * 1024;

/** Max total files to scan (prevents runaway scans on monorepos) */
const MAX_FILES = 5000;

/**
 * Recursively discover scannable files with parallel directory traversal.
 * Returns files sorted by priority (likely-vulnerable extensions first).
 */
async function getScannableFiles(dirPath) {
  const priorityFiles = [];
  const otherFiles = [];
  let fileCount = 0;

  async function walk(currentDir) {
    if (fileCount >= MAX_FILES) return;

    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    const subdirTasks = [];

    for (const entry of entries) {
      if (fileCount >= MAX_FILES) break;

      const name = entry.name;

      if (entry.isDirectory()) {
        // Fast skip on ignored dirs (Set.has is O(1))
        if (!IGNORED_DIRS.has(name) && name[0] !== ".") {
          subdirTasks.push(walk(path.join(currentDir, name)));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(name).toLowerCase();
        if (BINARY_EXTENSIONS.has(ext)) continue;

        const fullPath = path.join(currentDir, name);
        fileCount++;

        // Sort into priority and other buckets
        if (PRIORITY_EXTENSIONS.has(ext) || name === "Dockerfile" || name === ".env") {
          priorityFiles.push(fullPath);
        } else {
          otherFiles.push(fullPath);
        }
      }
    }

    // Traverse subdirectories concurrently
    if (subdirTasks.length > 0) {
      await Promise.all(subdirTasks);
    }
  }

  await walk(dirPath);

  // Priority files first, then the rest
  return priorityFiles.concat(otherFiles);
}

/**
 * Read file content for scanning — optimized.
 * Checks size before reading, detects binary via null bytes in first 512 bytes.
 */
async function readFileSafe(filePath) {
  try {
    const stats = await fs.stat(filePath);

    // Skip oversized or empty files
    if (stats.size > MAX_FILE_SIZE || stats.size === 0) return null;

    const buffer = await fs.readFile(filePath);

    // Binary detection — check first 512 bytes only (faster than 8KB)
    const sample = buffer.subarray(0, 512);
    if (sample.includes(0x00)) return null;

    const content = buffer.toString("utf-8");
    return { content, lines: content.split("\n") };
  } catch {
    return null;
  }
}

module.exports = {
  getScannableFiles,
  readFileSafe,
  IGNORED_DIRS,
  BINARY_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES,
};
