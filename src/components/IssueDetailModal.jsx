import { X, Code, ShieldCheck, AlertTriangle, ExternalLink, FileCode, Tag } from 'lucide-react'
import SeverityBadge from './SeverityBadge'

export default function IssueDetailModal({ issue, onClose }) {
  if (!issue) return null

  const severityColors = {
    Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    High: 'text-red-400 bg-red-500/10 border-red-500/20',
    Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }

  const severityDescriptions = {
    Critical: 'Immediate action required. This vulnerability can be exploited to gain full system access.',
    High: 'Must be fixed before deployment. This vulnerability poses a serious security risk.',
    Medium: 'Should be addressed soon. This issue could be exploited under certain conditions.',
    Low: 'Consider fixing. This is a best practice violation or minor security concern.',
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-navy-900 border border-surface-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-surface-800 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <SeverityBadge level={issue.severity} />
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {issue.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{issue.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Risk Level Banner */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${severityColors[issue.severity] || severityColors.Low}`}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold mb-1">Risk Level: {issue.severity}</p>
              <p className="text-xs opacity-80">
                {severityDescriptions[issue.severity] || severityDescriptions.Low}
              </p>
            </div>
          </div>

          {/* File Location */}
          <div>
            <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              Location
            </h3>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-navy-950 border border-surface-800 text-sm">
              <Code className="w-4 h-4 text-surface-400 shrink-0" />
              <span className="text-surface-300 font-mono">
                {issue.file} <span className="text-brand-400 font-semibold">:L{issue.line}</span>
              </span>
            </div>
          </div>

          {/* Code Snippet */}
          {issue.snippet && (
            <div>
              <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Code Snippet</h3>
              <div className="p-4 rounded-xl bg-navy-950 border border-surface-800 font-mono text-sm text-red-300 overflow-x-auto">
                <pre className="whitespace-pre-wrap break-all">{issue.snippet}</pre>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-surface-200 leading-relaxed text-sm">
              {issue.description}
            </p>
          </div>

          {/* OWASP Reference */}
          {issue.owasp && (
            <div>
              <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">OWASP Reference</h3>
              <a 
                href={`https://owasp.org/Top10/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/20 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                {issue.owasp}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            </div>
          )}

          {/* Remediation */}
          <div>
            <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              How to Fix
            </h3>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-100 text-sm leading-relaxed">
              {issue.remediation}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-800 bg-navy-950/50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-surface-800 hover:bg-surface-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
