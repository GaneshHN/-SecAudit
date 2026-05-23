import { Sparkles } from 'lucide-react'

export default function Changelog() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-accent-500/10 rounded-xl border border-accent-500/20 text-accent-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Changelog</h1>
          <p className="text-surface-400 text-sm">What's new in SecAudit.</p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded text-xs font-bold">v2.4.0</span>
            <span className="text-surface-500 text-sm">May 15, 2026</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">AI Auto-Remediation & Performance Boost</h2>
          <ul className="list-disc list-inside text-surface-300 space-y-2">
            <li>Introduced AI Auto-Remediation feature in beta.</li>
            <li>Improved dashboard loading times by 40%.</li>
            <li>Added new settings for CI/CD Security Gates.</li>
            <li>Fixed minor UI bugs in the History page.</li>
          </ul>
        </div>
        
        <div className="glass-card p-6 opacity-75">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 bg-surface-700 text-surface-300 border border-surface-600 rounded text-xs font-bold">v2.3.5</span>
            <span className="text-surface-500 text-sm">April 28, 2026</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Integrations Update</h2>
          <ul className="list-disc list-inside text-surface-300 space-y-2">
            <li>Added native GitLab CI integration.</li>
            <li>Improved webhook payload delivery reliability.</li>
            <li>Enhanced security for API tokens.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
