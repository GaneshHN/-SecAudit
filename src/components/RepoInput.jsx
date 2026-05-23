import { useState, useEffect, useRef } from 'react'
import { 
  ShieldCheck, 
  UploadCloud, 
  AlertCircle, 
  FileArchive,
  X,
  Globe,
  GitBranch
} from 'lucide-react'
import ScanButton from './ScanButton'

function GithubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

/**
 * Detect what type of input the user is entering.
 * Returns: 'repo' | 'url' | 'unknown'
 */
function detectInputType(value) {
  if (!value) return 'unknown'
  const trimmed = value.trim()
  
  // SSH format → repo
  if (trimmed.match(/^git@/)) return 'repo'
  // owner/repo shorthand → repo
  if (trimmed.match(/^[\w.-]+\/[\w.-]+$/) && !trimmed.includes('.')) return 'repo'
  // .git suffix → repo
  if (trimmed.endsWith('.git')) return 'repo'
  // Known git hosts
  if (/github\.com|gitlab\.|bitbucket\.org/i.test(trimmed)) return 'repo'
  // Any other URL-like string
  if (trimmed.match(/^https?:\/\//i) || trimmed.includes('.')) return 'url'
  
  return 'unknown'
}

export default function RepoInput({ onScan, loading, error: externalError }) {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState('')
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  const error = externalError || localError
  const inputType = detectInputType(url)

  useEffect(() => {
    let interval
    if (loading) {
      setProgress(0)
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + Math.floor(Math.random() * 15)
        })
      }, 400)
    } else {
      setProgress(100)
      const timeout = setTimeout(() => setProgress(0), 500)
      return () => clearTimeout(timeout)
    }
    return () => clearInterval(interval)
  }, [loading])

  const validateAndSubmit = () => {
    setLocalError('')

    if (!url && !file) {
      setLocalError('Please enter a URL or upload a file to scan.')
      return
    }

    // Basic URL validation — accept virtually anything that looks like a URL
    if (url) {
      const trimmed = url.trim()
      // Must be: a URL, git SSH, or owner/repo shorthand
      const isValid = 
        trimmed.match(/^https?:\/\/.+/) ||       // https://...
        trimmed.match(/^git@.+:.+/) ||            // git@host:owner/repo
        trimmed.match(/^[\w.-]+\/[\w.-]+$/) ||    // owner/repo
        trimmed.match(/^[\w.-]+\.[\w.-]+/) ||     // domain.com or sub.domain.com
        trimmed.includes('.')                      // anything with a dot
      
      if (!isValid) {
        setLocalError('Please enter a valid URL, domain, or repository path.')
        return
      }
    }

    onScan({
      type: file ? 'file' : 'url',
      payload: file || url
    })
  }

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    setLocalError('')
    setUrl('')
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
    }
  }

  const handleFileSelect = (e) => {
    setLocalError('')
    setUrl('')
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUrlChange = (e) => {
    setUrl(e.target.value)
    setLocalError('')
    if (file) setFile(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      validateAndSubmit()
    }
  }

  const clearSelection = () => {
    setFile(null)
    setUrl('')
    setLocalError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const hasInput = url.length > 0 || file !== null

  // Dynamic icon based on input type
  const InputIcon = inputType === 'repo' ? GitBranch : inputType === 'url' ? Globe : Globe

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      {/* ─── Main Card ─── */}
      <div className="glass-card relative overflow-hidden transition-all duration-300">
        <div 
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-accent-400 to-brand-500 transition-all duration-300 ease-out z-10"
          style={{ width: `${progress}%`, opacity: loading ? 1 : 0 }}
        />

        <div className="p-6 sm:p-8">
          {/* URL Input */}
          <div className="relative group">
            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${url ? (inputType === 'repo' ? 'text-brand-400' : 'text-accent-400') : 'text-surface-500 group-focus-within:text-brand-400'}`}>
              <InputIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-12 py-3.5 bg-navy-900/50 border border-surface-700 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200 shadow-inner"
              placeholder="Enter any URL, repo link, or domain — e.g. github.com/owner/repo or example.com"
              value={url}
              onChange={handleUrlChange}
              onKeyDown={handleKeyDown}
              disabled={loading || file !== null}
            />
            {url && !loading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                {/* Input type badge */}
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  inputType === 'repo' 
                    ? 'bg-brand-500/20 text-brand-400' 
                    : 'bg-accent-400/20 text-accent-400'
                }`}>
                  {inputType === 'repo' ? 'REPO' : 'URL'}
                </span>
                <button 
                  onClick={clearSelection}
                  className="flex items-center text-surface-500 hover:text-white transition-colors"
                  aria-label="Clear URL"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-surface-700/60"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Or upload your project
            </span>
            <div className="flex-grow border-t border-surface-700/60"></div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={`
              relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 text-center
              ${loading || url ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer'}
              ${file 
                ? 'border-brand-500 bg-brand-500/5' 
                : isDragging 
                  ? 'border-accent-400 bg-accent-400/5' 
                  : 'border-surface-700 hover:border-surface-500 hover:bg-white/[0.02]'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !loading && !url && fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            
            {file ? (
              <div className="flex flex-col items-center animate-fade-in-up">
                <div className="w-12 h-12 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mb-3">
                  <FileArchive className="w-6 h-6" />
                </div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-xs text-surface-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                  className="mt-3 text-sm text-brand-400 hover:text-brand-300 font-medium"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-200 ${isDragging ? 'bg-accent-400/20 text-accent-400' : 'bg-surface-800 text-surface-400'}`}>
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-white mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-surface-500">All files — Code, Archives, Documents, PDFs (max. 500MB)</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 mt-4 text-red-400 text-sm animate-fade-in-down bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Submit Button Component */}
          <ScanButton 
            className="w-full mt-6 py-3.5"
            loading={loading}
            disabled={!hasInput}
            onClick={validateAndSubmit}
          />
        </div>
        
        {/* Security Hint Footer */}
        <div className="bg-navy-950/50 px-6 py-3 border-t border-surface-800/50 flex items-center justify-center gap-2 text-xs text-surface-500">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>Accepts Git repos, website URLs, and file uploads. All scans are processed securely.</span>
        </div>
      </div>
    </div>
  )
}
