const path = require("path");
const { securityRules, severityWeights } = require("../rules");
const { getScannableFiles, readFileSafe } = require("../fileUtils");

// ─── Precompile: build newline offset index once per file ─────
// Instead of content.substring(0, matchIndex).split('\n').length
// for EVERY match, we precompute all newline offsets O(n) once,
// then binary-search for the line number O(log n) per match.

/**
 * Build a sorted array of newline byte offsets in the content string.
 * Used for fast line-number lookup via binary search.
 */
function buildLineIndex(content) {
  const offsets = [0]; // line 1 starts at offset 0
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "\n") {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

/**
 * Find the 1-indexed line number for a given character offset
 * using binary search on the precomputed line index.
 */
function getLineNumber(lineIndex, offset) {
  let lo = 0, hi = lineIndex.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (lineIndex[mid] <= offset) lo = mid + 1;
    else hi = mid - 1;
  }
  return lo; // 1-indexed line number
}

// ─── Early-exit threshold: cap issues per file ───────────────
const MAX_ISSUES_PER_FILE = 50;

/**
 * Scan a single file against all security rules.
 * Optimized with precomputed line index and early exit.
 */
function scanFileContent(content, lines, relativePath) {
  const issues = [];
  const lineIndex = buildLineIndex(content);

  for (const rule of securityRules) {
    // Create a fresh regex instance per scan to avoid lastIndex state issues
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const lineNumber = getLineNumber(lineIndex, match.index);
      const lineContent = lines[lineNumber - 1]?.trim() || "";

      issues.push({
        issue: rule.name,
        severity: rule.severity,
        category: rule.category || "Security",
        owasp: rule.owasp || "",
        file: relativePath,
        line: lineNumber,
        snippet: lineContent.length > 120 ? lineContent.substring(0, 120) + "..." : lineContent,
        description: rule.description,
        fix: rule.fix,
      });

      // Early exit if too many issues in one file
      if (issues.length >= MAX_ISSUES_PER_FILE) return issues;

      // Guard against zero-width matches
      if (match.index === regex.lastIndex) regex.lastIndex++;
    }
  }

  return issues;
}

/**
 * Read and scan a single file. Returns issues array.
 */
async function scanFile(filePath, rootDir) {
  const fileData = await readFileSafe(filePath);
  if (!fileData) return [];

  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
  return scanFileContent(fileData.content, fileData.lines, relativePath);
}

// ─── Score & Summary ──────────────────────────────────────────

function calculateScore(issues) {
  let penalty = 0;
  for (let i = 0; i < issues.length; i++) {
    penalty += severityWeights[issues[i].severity] || 0;
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}

function getSummary(issues) {
  let high = 0, medium = 0, low = 0;
  for (let i = 0; i < issues.length; i++) {
    switch (issues[i].severity) {
      case "High": high++; break;
      case "Medium": medium++; break;
      case "Low": low++; break;
    }
  }
  return { high, medium, low };
}

// ─── Main scan orchestrator ───────────────────────────────────

/** Concurrency limit for parallel file I/O */
const CONCURRENCY = 100;

/** Scan timeout — 60 seconds max */
const SCAN_TIMEOUT_MS = 60_000;

async function runScan(projectDir) {
  const t0 = performance.now();

  // Phase 1: File discovery
  console.log(`⏱️  Discovering files in: ${projectDir}`);
  const files = await getScannableFiles(projectDir);
  const t1 = performance.now();
  console.log(`   Found ${files.length} scannable files (${(t1 - t0).toFixed(0)}ms)`);

  // Phase 2: Parallel scanning with controlled concurrency
  const allIssues = [];
  const deadline = t0 + SCAN_TIMEOUT_MS;

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    // Timeout protection
    if (performance.now() > deadline) {
      console.log(`⚠️  Scan timeout reached after ${((performance.now() - t0) / 1000).toFixed(1)}s — scanned ${i}/${files.length} files`);
      break;
    }

    const batch = files.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((file) => scanFile(file, projectDir))
    );

    for (const issues of batchResults) {
      if (issues.length > 0) {
        for (let j = 0; j < issues.length; j++) {
          allIssues.push(issues[j]);
        }
      }
    }
  }

  const t2 = performance.now();

  // Phase 3: Sort by severity (High → Medium → Low)
  const severityOrder = { High: 0, Medium: 1, Low: 2 };
  allIssues.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  const scanDuration = ((t2 - t0) / 1000).toFixed(2);
  const score = calculateScore(allIssues);
  const summary = getSummary(allIssues);

  console.log(`✅ Scan complete: ${allIssues.length} issues in ${scanDuration}s`);
  console.log(`   Score: ${score}/100 | High: ${summary.high} | Medium: ${summary.medium} | Low: ${summary.low}`);
  console.log(`   Discovery: ${(t1 - t0).toFixed(0)}ms | Analysis: ${(t2 - t1).toFixed(0)}ms`);

  return {
    score,
    summary,
    totalIssues: allIssues.length,
    filesScanned: files.length,
    scanTime: `${scanDuration}s`,
    message: `Scanned ${files.length} files in ${scanDuration} seconds`,
    issues: allIssues,
  };
}

module.exports = { runScan };
