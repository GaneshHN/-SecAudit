const API_BASE = '/api'

/**
 * Transform backend response into the shape the Dashboard expects.
 * Handles both code scan and URL scan results.
 */
function transformScanResult(backendData, repoName) {
  const isUrlScan = backendData.scanType === 'url'

  return {
    repository: repoName || (isUrlScan ? backendData.urlInfo?.host : 'Uploaded Project'),
    timestamp: new Date().toISOString(),
    score: backendData.score,
    scanTime: backendData.scanTime,
    filesScanned: backendData.filesScanned,
    message: backendData.message,
    scanType: isUrlScan ? 'url' : 'code',
    urlInfo: backendData.urlInfo || null,
    summary: {
      totalIssues: backendData.totalIssues,
      critical: 0,
      high: backendData.summary.high,
      medium: backendData.summary.medium,
      low: backendData.summary.low,
    },
    vulnerabilities: backendData.issues.map((issue, index) => ({
      id: `VULN-${String(index + 1).padStart(3, '0')}`,
      title: issue.issue,
      severity: issue.severity,
      category: issue.category || 'Security',
      owasp: issue.owasp || '',
      file: issue.file,
      line: issue.line,
      description: issue.description,
      remediation: issue.fix,
      snippet: issue.snippet,
    })),
  }
}

/**
 * Extract a display name from any URL input.
 */
function extractDisplayName(url) {
  try {
    const trimmed = url.trim()
    
    // SSH format: git@host:user/repo.git
    const sshMatch = trimmed.match(/git@[^:]+:[\w.-]+\/([\w.-]+?)(?:\.git)?$/)
    if (sshMatch) return sshMatch[1]
    
    // Shorthand: owner/repo
    const shortMatch = trimmed.match(/^[\w.-]+\/([\w.-]+)$/)
    if (shortMatch) return shortMatch[1]
    
    // URL: extract hostname or repo name
    let checkUrl = trimmed
    if (!checkUrl.match(/^https?:\/\//)) checkUrl = 'https://' + checkUrl
    const parsed = new URL(checkUrl)
    
    // If it's a git host, extract repo name
    if (/github\.com|gitlab\.|bitbucket\.org/.test(parsed.hostname)) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts.length >= 2) return parts[1].replace('.git', '')
    }
    
    // Otherwise return the hostname
    return parsed.hostname
  } catch {
    return 'scan-result'
  }
}

/**
 * Scan a repository/URL/file.
 * Calls the real backend at POST /api/scan.
 */
export const scanRepository = async (payload, type = 'url', userId = null) => {
  let response

  if (type === 'file') {
    // File upload — send as FormData
    const formData = new FormData()
    formData.append('file', payload)
    if (userId) formData.append('userId', userId)

    response = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      body: formData,
    })
  } else {
    // URL scan — send as JSON
    const bodyData = { repoUrl: payload }
    if (userId) bodyData.userId = userId

    response = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    })
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Scan failed with status ${response.status}`)
  }

  const data = await response.json()
  const displayName = type === 'file' ? payload.name?.replace('.zip', '') : extractDisplayName(payload)

  return transformScanResult(data, displayName)
}

/**
 * Fetches the latest dashboard stats (placeholder when no scan data).
 */
export const getDashboardStats = async () => {
  return {
    repository: 'No scan data',
    timestamp: new Date().toISOString(),
    score: 100,
    scanType: 'code',
    summary: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
    vulnerabilities: [],
  }
}

/**
 * Fetch scan history for a user.
 */
export const getUserHistory = async (userId) => {
  if (!userId) return [];
  const response = await fetch(`${API_BASE}/history?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch scan history');
  }
  return response.json();
}

/**
 * Fetch details of a specific scan.
 */
export const getScanDetails = async (scanId) => {
  const response = await fetch(`${API_BASE}/history/${scanId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch scan details');
  }
  return response.json();
}

/**
 * Delete a specific scan from history.
 */
export const deleteScanHistory = async (scanId) => {
  const response = await fetch(`${API_BASE}/history/${scanId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete scan');
  }
  return response.json();
}
